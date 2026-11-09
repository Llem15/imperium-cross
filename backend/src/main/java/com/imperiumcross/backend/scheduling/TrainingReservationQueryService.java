package com.imperiumcross.backend.scheduling;

import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TrainingReservationQueryService {

    private static final String RESERVATION_LOCK = "imperiumcross-training-reservations";

    private final JdbcTemplate jdbcTemplate;

    public TrainingReservationQueryService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public TrainingReservationAvailability findAvailability(int membershipId) {
        MembershipDetails membership = requireReservableMembership(membershipId);
        int activeReservations = countActiveReservations(membershipId);
        List<TrainingAvailableSlot> availableSlots = List.of();
        int remaining = Math.max(0, membership.weeklyHours() - activeReservations);
        if (remaining > 0) {
            LocalDate firstDate = effectiveStart(membership);
            LocalDateTime now = LocalDateTime.now();
            if (!firstDate.isAfter(membership.endDate())) {
                List<TrainerShift> shifts = findTrainerShifts();
                List<SessionRow> sessions = findSessions(
                        firstDate.minusDays(1),
                        membership.endDate(),
                        false);
                availableSlots = findAvailableSlots(
                        membership.clientId(),
                        firstDate,
                        membership.endDate(),
                        now,
                        shifts,
                        sessions,
                        0);
            }
        }
        return new TrainingReservationAvailability(
                membershipId,
                membership.startDate(),
                membership.endDate(),
                membership.weeklyHours(),
                activeReservations,
                remaining,
                membership.changePeriodDays(),
                availableSlots);
    }

    public List<TrainingReservationSummary> findAll() {
        return jdbcTemplate.query("""
                SELECT r.id_reserva,
                       r.id_membresia,
                       r.id_cliente,
                       CONCAT(cliente.nombres, ' ', cliente.apellidos) AS nombre_cliente,
                       r.id_entrenador,
                       CONCAT(entrenador.nombres, ' ', entrenador.apellidos) AS nombre_entrenador,
                       r.dia_semana,
                       r.hora_inicio,
                       r.fecha_inicio,
                       r.fecha_fin,
                       r.estado,
                       r.fecha_ultimo_cambio,
                       pm.periodo_cambio_horario_dias,
                       CASE
                           WHEN pm.periodo_cambio_horario_dias > 0
                           THEN DATEADD(DAY, pm.periodo_cambio_horario_dias, r.fecha_ultimo_cambio)
                           ELSE NULL
                       END AS fecha_siguiente_cambio,
                       CASE
                           WHEN pm.periodo_cambio_horario_dias > 0
                                AND GETDATE() >= DATEADD(DAY, pm.periodo_cambio_horario_dias, r.fecha_ultimo_cambio)
                           THEN CAST(1 AS BIT)
                           ELSE CAST(0 AS BIT)
                       END AS puede_cambiar_horario,
                       (
                           SELECT COUNT(*)
                           FROM dbo.SesionEntrenamiento s
                           WHERE s.id_reserva = r.id_reserva AND s.estado = 'Reservada'
                       ) AS sesiones_reservadas
                FROM dbo.ReservaEntrenamiento r
                INNER JOIN dbo.Membresia m ON m.id_membresia = r.id_membresia
                INNER JOIN dbo.PlanMembresia pm ON pm.id_plan = m.id_plan
                INNER JOIN dbo.Cliente c ON c.id_cliente = r.id_cliente
                INNER JOIN dbo.Usuario cliente ON cliente.id_usuario = c.id_usuario
                INNER JOIN dbo.Usuario entrenador ON entrenador.id_usuario = r.id_entrenador
                ORDER BY r.estado, r.fecha_inicio, r.dia_semana, r.hora_inicio, r.id_reserva
                """,
                (rs, rowNum) -> new TrainingReservationSummary(
                        rs.getInt("id_reserva"),
                        rs.getInt("id_membresia"),
                        rs.getInt("id_cliente"),
                        rs.getString("nombre_cliente"),
                        rs.getInt("id_entrenador"),
                        rs.getString("nombre_entrenador"),
                        rs.getInt("dia_semana"),
                        rs.getTime("hora_inicio").toLocalTime(),
                        rs.getDate("fecha_inicio").toLocalDate(),
                        rs.getDate("fecha_fin").toLocalDate(),
                        rs.getString("estado"),
                        rs.getInt("sesiones_reservadas"),
                        rs.getInt("periodo_cambio_horario_dias"),
                        rs.getDate("fecha_ultimo_cambio").toLocalDate(),
                        rs.getDate("fecha_siguiente_cambio") == null
                                ? null
                                : rs.getDate("fecha_siguiente_cambio").toLocalDate(),
                        rs.getBoolean("puede_cambiar_horario")));
    }

    public TrainingReservationAvailability findChangeAvailability(int reservationId) {
        ReservationState reservation = findReservationState(reservationId);
        if (!"Activa".equals(reservation.status())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Solo se puede cambiar una reserva activa.");
        }
        MembershipDetails membership = requireReservableMembership(reservation.membershipId());
        LocalDate nextChangeDate = reservation.lastChangeDate().plusDays(membership.changePeriodDays());
        if (!TrainingReservationRules.canChangeSchedule(
                reservation.lastChangeDate(),
                LocalDate.now(),
                membership.changePeriodDays())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    membership.changePeriodDays() <= 0
                            ? "Este plan mantiene un horario fijo durante toda la membresía."
                            : "Podrás cambiar el horario desde el " + nextChangeDate + ".");
        }

        LocalDate firstDate = effectiveStart(membership);
        LocalDateTime now = LocalDateTime.now();
        List<TrainerShift> shifts = findTrainerShifts();
        List<SessionRow> sessions = findSessions(firstDate.minusDays(1), membership.endDate(), false);
        List<TrainingAvailableSlot> availableSlots = findAvailableSlots(
                membership.clientId(),
                firstDate,
                membership.endDate(),
                now,
                shifts,
                sessions,
                reservationId);
        return new TrainingReservationAvailability(
                reservation.membershipId(),
                membership.startDate(),
                membership.endDate(),
                membership.weeklyHours(),
                countActiveReservations(reservation.membershipId()),
                1,
                membership.changePeriodDays(),
                availableSlots);
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public TrainingReservationSummary create(TrainingReservationRequest request) {
        acquireReservationLock();
        MembershipDetails membership = requireReservableMembership(request.idMembresia());
        int activeReservations = countActiveReservations(request.idMembresia());
        if (activeReservations >= membership.weeklyHours()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "La membresía ya tiene todas sus sesiones semanales reservadas.");
        }

        LocalDate firstDate = effectiveStart(membership);
        LocalDateTime now = LocalDateTime.now();
        List<LocalDate> dates = TrainingReservationRules.futureOccurrences(
                firstDate,
                membership.endDate(),
                request.diaSemana(),
                now,
                request.horaInicio());
        if (dates.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No quedan sesiones futuras dentro de la vigencia de la membresía.");
        }

        List<TrainerShift> shifts = findTrainerShifts();
        List<SessionRow> sessions = findSessions(firstDate.minusDays(1), membership.endDate(), true);
        Set<Integer> availableTrainers = availableTrainers(
                membership.clientId(),
                request.diaSemana(),
                request.horaInicio(),
                dates,
                shifts,
                sessions,
                0);
        if (availableTrainers.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ese horario no está disponible para todas las semanas restantes de la membresía.");
        }

        int trainerId = availableTrainers.stream()
                .min(Comparator
                        .comparingLong((Integer id) -> sessions.stream()
                                .filter(session -> session.trainerId() == id)
                                .count())
                        .thenComparingInt(Integer::intValue))
                .orElseThrow();

        try {
            Integer reservationId = jdbcTemplate.queryForObject("""
                    INSERT INTO dbo.ReservaEntrenamiento
                        (id_membresia, id_cliente, id_entrenador, dia_semana, hora_inicio,
                         fecha_inicio, fecha_fin, estado, fecha_ultimo_cambio)
                    OUTPUT INSERTED.id_reserva
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'Activa', CAST(GETDATE() AS DATE))
                    """,
                    Integer.class,
                    request.idMembresia(),
                    membership.clientId(),
                    trainerId,
                    request.diaSemana(),
                    request.horaInicio(),
                    Date.valueOf(membership.startDate()),
                    Date.valueOf(membership.endDate()));
            if (reservationId == null) {
                throw new IllegalStateException("SQL Server no devolvió el identificador de reserva.");
            }

            for (LocalDate date : dates) {
                jdbcTemplate.update("""
                        INSERT INTO dbo.SesionEntrenamiento
                            (id_reserva, id_cliente, id_entrenador, fecha_sesion, hora_inicio, estado)
                        VALUES (?, ?, ?, ?, ?, 'Reservada')
                        """,
                        reservationId,
                        membership.clientId(),
                        trainerId,
                        Date.valueOf(date),
                        request.horaInicio());
            }
            return findReservation(reservationId);
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "El horario fue reservado por otra operación. Consulta la disponibilidad e inténtalo de nuevo.",
                    exception);
        }
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public TrainingReservationSummary changeSchedule(
            int reservationId,
            TrainingReservationChangeRequest request) {
        acquireReservationLock();
        ReservationState reservation = findReservationStateForUpdate(reservationId);
        if (!"Activa".equals(reservation.status())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Solo se puede cambiar una reserva activa.");
        }
        MembershipDetails membership = requireReservableMembership(reservation.membershipId());
        LocalDate nextChangeDate = reservation.lastChangeDate().plusDays(membership.changePeriodDays());
        if (!TrainingReservationRules.canChangeSchedule(
                reservation.lastChangeDate(),
                LocalDate.now(),
                membership.changePeriodDays())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    membership.changePeriodDays() <= 0
                            ? "Este plan mantiene un horario fijo durante toda la membresía."
                            : "Podrás cambiar el horario desde el " + nextChangeDate + ".");
        }
        if (reservation.dayOfWeek() == request.diaSemana()
                && reservation.start().equals(request.horaInicio())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Selecciona un horario distinto al actual.");
        }

        LocalDate firstDate = effectiveStart(membership);
        LocalDateTime now = LocalDateTime.now();
        List<LocalDate> dates = TrainingReservationRules.futureOccurrences(
                firstDate,
                membership.endDate(),
                request.diaSemana(),
                now,
                request.horaInicio());
        if (dates.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No quedan sesiones futuras dentro de la vigencia de la membresía.");
        }
        List<TrainerShift> shifts = findTrainerShifts();
        List<SessionRow> sessions = findSessions(firstDate.minusDays(1), membership.endDate(), true);
        Set<Integer> availableTrainers = availableTrainers(
                membership.clientId(),
                request.diaSemana(),
                request.horaInicio(),
                dates,
                shifts,
                sessions,
                reservationId);
        if (availableTrainers.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ese horario no está disponible para todas las semanas restantes de la membresía.");
        }
        int trainerId = availableTrainers.stream()
                .min(Comparator
                        .comparingLong((Integer id) -> sessions.stream()
                                .filter(session -> session.trainerId() == id
                                        && session.reservationId() != reservationId)
                                .count())
                        .thenComparingInt(Integer::intValue))
                .orElseThrow();

        try {
            jdbcTemplate.update("""
                    UPDATE dbo.SesionEntrenamiento
                    SET estado = 'Cancelada'
                    WHERE id_reserva = ?
                      AND estado = 'Reservada'
                      AND DATEADD(
                            SECOND,
                            DATEDIFF(SECOND, CONVERT(TIME, '00:00:00'), hora_inicio),
                            CONVERT(DATETIME2, fecha_sesion)
                          ) > SYSDATETIME()
                    """,
                    reservationId);
            jdbcTemplate.update("""
                    UPDATE dbo.ReservaEntrenamiento
                    SET dia_semana = ?,
                        hora_inicio = ?,
                        id_entrenador = ?,
                        fecha_ultimo_cambio = CAST(GETDATE() AS DATE)
                    WHERE id_reserva = ? AND estado = 'Activa'
                    """,
                    request.diaSemana(),
                    request.horaInicio(),
                    trainerId,
                    reservationId);
            for (LocalDate date : dates) {
                jdbcTemplate.update("""
                        INSERT INTO dbo.SesionEntrenamiento
                            (id_reserva, id_cliente, id_entrenador, fecha_sesion, hora_inicio, estado)
                        VALUES (?, ?, ?, ?, ?, 'Reservada')
                        """,
                        reservationId,
                        membership.clientId(),
                        trainerId,
                        Date.valueOf(date),
                        request.horaInicio());
            }
            return findReservation(reservationId);
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "El horario fue reservado por otra operación. Consulta la disponibilidad e inténtalo de nuevo.",
                    exception);
        }
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public void cancel(int reservationId) {
        acquireReservationLock();
        List<String> statuses = jdbcTemplate.query(
                """
                        SELECT estado
                        FROM dbo.ReservaEntrenamiento WITH (UPDLOCK, HOLDLOCK)
                        WHERE id_reserva = ?
                        """,
                (rs, rowNum) -> rs.getString("estado"),
                reservationId);
        if (statuses.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró la reserva.");
        }
        if ("Cancelada".equals(statuses.get(0))) return;

        jdbcTemplate.update("""
                UPDATE dbo.SesionEntrenamiento
                SET estado = 'Cancelada'
                WHERE id_reserva = ?
                  AND estado = 'Reservada'
                  AND DATEADD(
                        SECOND,
                        DATEDIFF(SECOND, CONVERT(TIME, '00:00:00'), hora_inicio),
                        CONVERT(DATETIME2, fecha_sesion)
                      ) > SYSDATETIME()
                """,
                reservationId);
        jdbcTemplate.update("""
                UPDATE dbo.ReservaEntrenamiento
                SET estado = 'Cancelada'
                WHERE id_reserva = ? AND estado = 'Activa'
                """,
                reservationId);
    }

    private TrainingReservationSummary findReservation(int reservationId) {
        List<TrainingReservationSummary> reservations = jdbcTemplate.query("""
                SELECT r.id_reserva,
                       r.id_membresia,
                       r.id_cliente,
                       CONCAT(cliente.nombres, ' ', cliente.apellidos) AS nombre_cliente,
                       r.id_entrenador,
                       CONCAT(entrenador.nombres, ' ', entrenador.apellidos) AS nombre_entrenador,
                       r.dia_semana,
                       r.hora_inicio,
                       r.fecha_inicio,
                       r.fecha_fin,
                       r.estado,
                       r.fecha_ultimo_cambio,
                       pm.periodo_cambio_horario_dias,
                       CASE
                           WHEN pm.periodo_cambio_horario_dias > 0
                           THEN DATEADD(DAY, pm.periodo_cambio_horario_dias, r.fecha_ultimo_cambio)
                           ELSE NULL
                       END AS fecha_siguiente_cambio,
                       CASE
                           WHEN pm.periodo_cambio_horario_dias > 0
                                AND GETDATE() >= DATEADD(DAY, pm.periodo_cambio_horario_dias, r.fecha_ultimo_cambio)
                           THEN CAST(1 AS BIT)
                           ELSE CAST(0 AS BIT)
                       END AS puede_cambiar_horario,
                       (
                           SELECT COUNT(*)
                           FROM dbo.SesionEntrenamiento s
                           WHERE s.id_reserva = r.id_reserva AND s.estado = 'Reservada'
                       ) AS sesiones_reservadas
                FROM dbo.ReservaEntrenamiento r
                INNER JOIN dbo.Membresia m ON m.id_membresia = r.id_membresia
                INNER JOIN dbo.PlanMembresia pm ON pm.id_plan = m.id_plan
                INNER JOIN dbo.Cliente c ON c.id_cliente = r.id_cliente
                INNER JOIN dbo.Usuario cliente ON cliente.id_usuario = c.id_usuario
                INNER JOIN dbo.Usuario entrenador ON entrenador.id_usuario = r.id_entrenador
                WHERE r.id_reserva = ?
                """,
                (rs, rowNum) -> new TrainingReservationSummary(
                        rs.getInt("id_reserva"),
                        rs.getInt("id_membresia"),
                        rs.getInt("id_cliente"),
                        rs.getString("nombre_cliente"),
                        rs.getInt("id_entrenador"),
                        rs.getString("nombre_entrenador"),
                        rs.getInt("dia_semana"),
                        rs.getTime("hora_inicio").toLocalTime(),
                        rs.getDate("fecha_inicio").toLocalDate(),
                        rs.getDate("fecha_fin").toLocalDate(),
                        rs.getString("estado"),
                        rs.getInt("sesiones_reservadas"),
                        rs.getInt("periodo_cambio_horario_dias"),
                        rs.getDate("fecha_ultimo_cambio").toLocalDate(),
                        rs.getDate("fecha_siguiente_cambio") == null
                                ? null
                                : rs.getDate("fecha_siguiente_cambio").toLocalDate(),
                        rs.getBoolean("puede_cambiar_horario")),
                reservationId);
        if (reservations.isEmpty()) {
            throw new IllegalStateException("No se pudo leer la reserva recién creada.");
        }
        return reservations.get(0);
    }

    private MembershipDetails requireReservableMembership(int membershipId) {
        List<MembershipDetails> memberships = jdbcTemplate.query("""
                SELECT m.id_cliente,
                       m.fecha_inicio,
                       m.fecha_fin,
                       m.estado AS estado_membresia,
                       pm.horas_entrenamiento_semana,
                       pm.periodo_cambio_horario_dias,
                       c.estado AS estado_cliente,
                       u.estado AS estado_usuario,
                       pago.estado_pago
                FROM dbo.Membresia m
                INNER JOIN dbo.PlanMembresia pm ON pm.id_plan = m.id_plan
                INNER JOIN dbo.Cliente c ON c.id_cliente = m.id_cliente
                INNER JOIN dbo.Usuario u ON u.id_usuario = c.id_usuario
                OUTER APPLY (
                    SELECT TOP 1 p.estado_pago
                    FROM dbo.Pago p
                    WHERE p.id_membresia = m.id_membresia
                    ORDER BY p.id_pago DESC
                ) pago
                WHERE m.id_membresia = ?
                """,
                (rs, rowNum) -> new MembershipDetails(
                        rs.getInt("id_cliente"),
                        rs.getDate("fecha_inicio").toLocalDate(),
                        rs.getDate("fecha_fin").toLocalDate(),
                        rs.getString("estado_membresia"),
                        rs.getInt("horas_entrenamiento_semana"),
                        rs.getInt("periodo_cambio_horario_dias"),
                        rs.getBoolean("estado_cliente"),
                        rs.getBoolean("estado_usuario"),
                        rs.getString("estado_pago")),
                membershipId);
        if (memberships.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró la membresía.");
        }
        MembershipDetails membership = memberships.get(0);
        if (!membership.clientActive() || !membership.userActive()
                || !("Activa".equals(membership.status()) || "Programada".equals(membership.status()))
                || !"Pagado".equals(membership.paymentStatus())
                || membership.endDate().isBefore(LocalDate.now())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "La reserva requiere una membresía pagada, vigente y de un cliente activo.");
        }
        if (membership.weeklyHours() <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "El plan de esta membresía no tiene sesiones semanales configuradas.");
        }
        return membership;
    }

    private int countActiveReservations(int membershipId) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM dbo.ReservaEntrenamiento
                WHERE id_membresia = ? AND estado = 'Activa'
                """,
                Integer.class,
                membershipId);
        return count == null ? 0 : count;
    }

    private List<TrainerShift> findTrainerShifts() {
        return jdbcTemplate.query("""
                SELECT h.id_entrenador,
                       h.dia_semana,
                       h.hora_inicio,
                       h.hora_fin
                FROM dbo.HorarioEntrenador h
                INNER JOIN dbo.Usuario u ON u.id_usuario = h.id_entrenador AND u.estado = 1
                INNER JOIN dbo.Rol r ON r.id_rol = u.id_rol AND r.nombre_rol = 'Entrenador'
                WHERE h.estado = 1
                ORDER BY h.id_entrenador, h.dia_semana, h.hora_inicio
                """,
                (rs, rowNum) -> new TrainerShift(
                        rs.getInt("id_entrenador"),
                        rs.getInt("dia_semana"),
                        rs.getTime("hora_inicio").toLocalTime(),
                        rs.getTime("hora_fin").toLocalTime()));
    }

    private List<SessionRow> findSessions(LocalDate start, LocalDate end, boolean lockRows) {
        String sql = lockRows
                ? """
                        SELECT id_reserva, id_cliente, id_entrenador, fecha_sesion, hora_inicio
                        FROM dbo.SesionEntrenamiento WITH (UPDLOCK, HOLDLOCK)
                        WHERE estado = 'Reservada' AND fecha_sesion BETWEEN ? AND ?
                        """
                : """
                        SELECT id_reserva, id_cliente, id_entrenador, fecha_sesion, hora_inicio
                        FROM dbo.SesionEntrenamiento
                        WHERE estado = 'Reservada' AND fecha_sesion BETWEEN ? AND ?
                        """;
        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new SessionRow(
                        rs.getInt("id_reserva"),
                        rs.getInt("id_cliente"),
                        rs.getInt("id_entrenador"),
                        rs.getDate("fecha_sesion").toLocalDate(),
                        rs.getTime("hora_inicio").toLocalTime()),
                Date.valueOf(start),
                Date.valueOf(end));
    }

    private List<TrainingAvailableSlot> findAvailableSlots(
            int clientId,
            LocalDate start,
            LocalDate end,
            LocalDateTime now,
            List<TrainerShift> shifts,
            List<SessionRow> sessions,
            int ignoredReservationId) {
        Set<TrainingAvailableSlot> available = new HashSet<>();
        for (TrainerShift shift : shifts) {
            for (LocalTime time : TrainingReservationRules.slots(shift.start(), shift.end())) {
                List<LocalDate> dates = TrainingReservationRules.futureOccurrences(
                        start,
                        end,
                        shift.dayOfWeek(),
                        now,
                        time);
                if (!dates.isEmpty()
                        && !availableTrainers(
                                clientId,
                                shift.dayOfWeek(),
                                time,
                                dates,
                                shifts,
                                sessions,
                                ignoredReservationId).isEmpty()) {
                    available.add(new TrainingAvailableSlot(shift.dayOfWeek(), time));
                }
            }
        }
        return available.stream()
                .sorted(Comparator.comparingInt(TrainingAvailableSlot::diaSemana)
                        .thenComparing(TrainingAvailableSlot::horaInicio))
                .toList();
    }

    private Set<Integer> availableTrainers(
            int clientId,
            int dayOfWeek,
            LocalTime time,
            List<LocalDate> dates,
            List<TrainerShift> shifts,
            List<SessionRow> sessions,
            int ignoredReservationId) {
        Set<Integer> candidateTrainers = new HashSet<>();
        for (TrainerShift shift : shifts) {
            if (shift.dayOfWeek() == dayOfWeek
                    && TrainingReservationRules.slots(shift.start(), shift.end()).contains(time)) {
                candidateTrainers.add(shift.trainerId());
            }
        }

        candidateTrainers.removeIf(trainerId -> dates.stream().anyMatch(date -> sessions.stream()
                .anyMatch(session -> session.reservationId() != ignoredReservationId
                        && session.date().equals(date)
                        && (session.clientId() == clientId || session.trainerId() == trainerId)
                        && TrainingReservationRules.overlaps(date, time, session.date(), session.start()))));
        return candidateTrainers;
    }

    private static LocalDate effectiveStart(MembershipDetails membership) {
        LocalDate today = LocalDate.now();
        return membership.startDate().isAfter(today) ? membership.startDate() : today;
    }

    private void acquireReservationLock() {
        Integer result = jdbcTemplate.queryForObject("""
                DECLARE @lock_result INT;
                EXEC @lock_result = sys.sp_getapplock
                    @Resource = ?,
                    @LockMode = 'Exclusive',
                    @LockOwner = 'Transaction',
                    @LockTimeout = 10000;
                SELECT @lock_result;
                """,
                Integer.class,
                RESERVATION_LOCK);
        if (result == null || result < 0) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "No se pudo bloquear temporalmente la agenda. Inténtalo de nuevo.");
        }
    }

    private record MembershipDetails(
            int clientId,
            LocalDate startDate,
            LocalDate endDate,
            String status,
            int weeklyHours,
            int changePeriodDays,
            boolean clientActive,
            boolean userActive,
            String paymentStatus) {
    }

    private ReservationState findReservationState(int reservationId) {
        return queryReservationState(reservationId, false);
    }

    private ReservationState findReservationStateForUpdate(int reservationId) {
        return queryReservationState(reservationId, true);
    }

    private ReservationState queryReservationState(int reservationId, boolean lockRow) {
        String sql = lockRow
                ? """
                        SELECT id_membresia, estado, dia_semana, hora_inicio, fecha_ultimo_cambio
                        FROM dbo.ReservaEntrenamiento WITH (UPDLOCK, HOLDLOCK)
                        WHERE id_reserva = ?
                        """
                : """
                        SELECT id_membresia, estado, dia_semana, hora_inicio, fecha_ultimo_cambio
                        FROM dbo.ReservaEntrenamiento
                        WHERE id_reserva = ?
                        """;
        List<ReservationState> reservations = jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new ReservationState(
                        rs.getInt("id_membresia"),
                        rs.getString("estado"),
                        rs.getInt("dia_semana"),
                        rs.getTime("hora_inicio").toLocalTime(),
                        rs.getDate("fecha_ultimo_cambio").toLocalDate()),
                reservationId);
        if (reservations.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró la reserva.");
        }
        return reservations.get(0);
    }

    private record ReservationState(
            int membershipId,
            String status,
            int dayOfWeek,
            LocalTime start,
            LocalDate lastChangeDate) {
    }

    private record TrainerShift(int trainerId, int dayOfWeek, LocalTime start, LocalTime end) {
    }

    private record SessionRow(
            int reservationId,
            int clientId,
            int trainerId,
            LocalDate date,
            LocalTime start) {
    }
}
