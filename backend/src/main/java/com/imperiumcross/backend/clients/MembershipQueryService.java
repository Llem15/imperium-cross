package com.imperiumcross.backend.clients;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MembershipQueryService {

    private static final String FIND_ALL_SQL = """
            SELECT m.id_membresia,
                   m.id_cliente,
                   u.nombres,
                   u.apellidos,
                   m.id_plan,
                   p.nombre_plan,
                   m.fecha_inicio,
                   m.fecha_fin,
                   CASE
                       WHEN m.estado = 'Programada'
                            AND m.fecha_inicio <= CAST(GETDATE() AS DATE) THEN 'Activa'
                       ELSE m.estado
                   END AS estado_membresia,
                   pago.id_pago,
                   pago.monto,
                   pago.metodo_pago,
                   pago.estado_pago
            FROM dbo.Membresia m
            INNER JOIN dbo.Cliente c ON c.id_cliente = m.id_cliente
            INNER JOIN dbo.Usuario u ON u.id_usuario = c.id_usuario
            INNER JOIN dbo.PlanMembresia p ON p.id_plan = m.id_plan
            OUTER APPLY (
                SELECT TOP 1 pg.id_pago, pg.monto, pg.metodo_pago, pg.estado_pago
                FROM dbo.Pago pg
                WHERE pg.id_membresia = m.id_membresia
                ORDER BY pg.id_pago DESC
            ) pago
            ORDER BY m.fecha_inicio DESC, m.id_membresia DESC
            """;

    private final JdbcTemplate jdbcTemplate;

    public MembershipQueryService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<MembershipPaymentSummary> findAll() {
        return jdbcTemplate.query(FIND_ALL_SQL, (rs, rowNum) -> {
            int paymentId = rs.getInt("id_pago");
            Integer nullablePaymentId = rs.wasNull() ? null : paymentId;
            return new MembershipPaymentSummary(
                    rs.getInt("id_membresia"),
                    rs.getInt("id_cliente"),
                    rs.getString("nombres"),
                    rs.getString("apellidos"),
                    rs.getInt("id_plan"),
                    rs.getString("nombre_plan"),
                    rs.getDate("fecha_inicio").toLocalDate(),
                    rs.getDate("fecha_fin").toLocalDate(),
                    rs.getString("estado_membresia"),
                    nullablePaymentId,
                    rs.getBigDecimal("monto"),
                    rs.getString("metodo_pago"),
                    rs.getString("estado_pago"));
        });
    }

    @Transactional
    public int create(MembershipRequest request) {
        Integer activeClientCount = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM dbo.Cliente c
                INNER JOIN dbo.Usuario u ON u.id_usuario = c.id_usuario
                WHERE c.id_cliente = ? AND c.estado = 1 AND u.estado = 1
                """, Integer.class, request.idCliente());
        if (activeClientCount == null || activeClientCount == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona un cliente activo.");
        }

        List<PlanDetails> plans = jdbcTemplate.query("""
                SELECT duracion_dias, precio
                FROM dbo.PlanMembresia
                WHERE id_plan = ? AND estado = 1
                """,
                (rs, rowNum) -> new PlanDetails(rs.getInt("duracion_dias"), rs.getBigDecimal("precio")),
                request.idPlan());
        if (plans.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona un plan activo.");
        }

        PlanDetails plan = plans.get(0);
        LocalDate startDate = LocalDate.now();
        LocalDate endDate = startDate.plusDays(plan.durationDays());
        Integer membershipId = jdbcTemplate.queryForObject("""
                INSERT INTO dbo.Membresia
                    (id_cliente, id_plan, fecha_inicio, fecha_fin, estado)
                OUTPUT INSERTED.id_membresia
                VALUES (?, ?, ?, ?, 'Pendiente')
                """,
                Integer.class,
                request.idCliente(),
                request.idPlan(),
                Date.valueOf(startDate),
                Date.valueOf(endDate));

        Integer paymentId = jdbcTemplate.queryForObject("""
                INSERT INTO dbo.Pago
                    (id_membresia, monto, metodo_pago, tipo_pago, estado_pago)
                OUTPUT INSERTED.id_pago
                VALUES (?, ?, ?, 'Membresia', 'Pendiente')
                """,
                Integer.class,
                membershipId,
                plan.price(),
                request.metodoPago());

        return paymentId;
    }

    @Transactional
    public void changePlan(int membershipId, MembershipChangeRequest request) {
        List<ExistingMembership> memberships = jdbcTemplate.query("""
                SELECT m.id_cliente,
                       m.id_plan,
                       m.estado,
                       m.fecha_fin,
                       pg.estado_pago
                FROM dbo.Membresia m
                OUTER APPLY (
                    SELECT TOP 1 p.estado_pago
                    FROM dbo.Pago p
                    WHERE p.id_membresia = m.id_membresia
                    ORDER BY p.id_pago DESC
                ) pg
                WHERE m.id_membresia = ?
                """,
                (rs, rowNum) -> new ExistingMembership(
                        rs.getInt("id_cliente"),
                        rs.getInt("id_plan"),
                        rs.getString("estado"),
                        rs.getDate("fecha_fin").toLocalDate(),
                        rs.getString("estado_pago")),
                membershipId);
        if (memberships.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró la membresía.");
        }

        ExistingMembership existing = memberships.get(0);
        if ("Cancelada".equals(existing.membershipStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No se puede cambiar el plan de una membresía cancelada.");
        }
        if ("Pagado".equals(existing.paymentStatus())) {
            if ("Inmediato".equals(request.vigencia())) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Una membresía pagada solo puede cambiar de plan al vencimiento.");
            }
        }

        List<PlanDetails> plans = jdbcTemplate.query("""
                SELECT duracion_dias, precio
                FROM dbo.PlanMembresia
                WHERE id_plan = ? AND estado = 1
                """,
                (rs, rowNum) -> new PlanDetails(rs.getInt("duracion_dias"), rs.getBigDecimal("precio")),
                request.idPlan());
        if (plans.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona un plan activo.");
        }
        if (existing.planId() == request.idPlan()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona un plan distinto.");
        }

        LocalDate startDate;
        if ("Inmediato".equals(request.vigencia())) {
            if ("Pagado".equals(existing.paymentStatus())) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Una membresía pagada solo puede cambiar de plan al vencimiento.");
            }
            startDate = LocalDate.now();
            jdbcTemplate.update("""
                    UPDATE dbo.Pago
                    SET estado_pago = 'Anulado'
                    WHERE id_membresia = ? AND estado_pago = 'Pendiente'
                    """, membershipId);
            int cancelledMemberships = jdbcTemplate.update("""
                    UPDATE dbo.Membresia
                    SET estado = 'Cancelada'
                    WHERE id_membresia = ? AND estado <> 'Cancelada'
                      AND NOT EXISTS (
                          SELECT 1
                          FROM dbo.Pago
                          WHERE id_membresia = ? AND estado_pago = 'Pagado'
                      )
                    """, membershipId, membershipId);
            if (cancelledMemberships != 1) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "No se pudo cerrar la membresía anterior de forma consistente.");
            }
        } else {
            Integer scheduledCount = jdbcTemplate.queryForObject("""
                    SELECT COUNT(*)
                    FROM dbo.Membresia
                    WHERE id_cliente = ?
                      AND id_membresia <> ?
                      AND fecha_inicio > CAST(GETDATE() AS DATE)
                      AND estado IN ('Pendiente', 'Programada')
                    """, Integer.class, existing.clientId(), membershipId);
            if (scheduledCount != null && scheduledCount > 0) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Este cliente ya tiene un cambio de plan programado.");
            }
            startDate = existing.endDate().plusDays(1);
            if (startDate.isBefore(LocalDate.now())) startDate = LocalDate.now();
        }

        PlanDetails plan = plans.get(0);
        LocalDate endDate = startDate.plusDays(plan.durationDays());
        Integer newMembershipId = jdbcTemplate.queryForObject("""
                INSERT INTO dbo.Membresia
                    (id_cliente, id_plan, fecha_inicio, fecha_fin, estado)
                OUTPUT INSERTED.id_membresia
                VALUES (?, ?, ?, ?, 'Pendiente')
                """,
                Integer.class,
                existing.clientId(),
                request.idPlan(),
                Date.valueOf(startDate),
                Date.valueOf(endDate));
        jdbcTemplate.update("""
                INSERT INTO dbo.Pago
                    (id_membresia, monto, metodo_pago, tipo_pago, estado_pago)
                VALUES (?, ?, ?, 'Membresia', 'Pendiente')
                """,
                newMembershipId,
                plan.price(),
                request.metodoPago());
    }

    @Transactional
    public void cancel(int membershipId) {
        List<MembershipCancellation> memberships = jdbcTemplate.query("""
                SELECT m.estado,
                       pg.estado_pago
                FROM dbo.Membresia m
                OUTER APPLY (
                    SELECT TOP 1 p.estado_pago
                    FROM dbo.Pago p
                    WHERE p.id_membresia = m.id_membresia
                    ORDER BY p.id_pago DESC
                ) pg
                WHERE m.id_membresia = ?
                """,
                (rs, rowNum) -> new MembershipCancellation(
                        rs.getString("estado"),
                        rs.getString("estado_pago")),
                membershipId);
        if (memberships.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró la membresía.");
        }

        MembershipCancellation membership = memberships.get(0);
        if ("Cancelada".equals(membership.membershipStatus())) return;
        if ("Pagado".equals(membership.paymentStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No se puede dar de baja una membresía pagada hasta gestionar el reembolso por separado.");
        }

        jdbcTemplate.update("""
                UPDATE dbo.Pago
                SET estado_pago = 'Anulado'
                WHERE id_membresia = ? AND estado_pago = 'Pendiente'
                """, membershipId);
        int updatedMemberships = jdbcTemplate.update("""
                UPDATE dbo.Membresia
                SET estado = 'Cancelada'
                WHERE id_membresia = ? AND estado <> 'Cancelada'
                  AND NOT EXISTS (
                      SELECT 1
                      FROM dbo.Pago
                      WHERE id_membresia = ? AND estado_pago = 'Pagado'
                  )
                """, membershipId, membershipId);
        if (updatedMemberships != 1) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No se pudo cancelar la membresía de forma consistente.");
        }
    }

    @Transactional
    public void confirmPayment(int paymentId) {
        List<PaymentState> payments = jdbcTemplate.query("""
                SELECT pg.estado_pago,
                       m.estado AS estado_membresia,
                       m.fecha_inicio,
                       m.fecha_fin
                FROM dbo.Pago pg
                INNER JOIN dbo.Membresia m ON m.id_membresia = pg.id_membresia
                WHERE pg.id_pago = ?
                """,
                (rs, rowNum) -> new PaymentState(
                        rs.getString("estado_pago"),
                        rs.getString("estado_membresia"),
                        rs.getDate("fecha_inicio").toLocalDate(),
                        rs.getDate("fecha_fin").toLocalDate()),
                paymentId);
        if (payments.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró el pago.");
        }

        PaymentState payment = payments.get(0);
        if ("Pagado".equals(payment.paymentStatus())) return;
        if (!"Pendiente".equals(payment.paymentStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Solo se pueden confirmar pagos pendientes.");
        }
        if (!"Pendiente".equals(payment.membershipStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "La membresía ya no está pendiente; revisa su estado antes de confirmar el pago.");
        }
        if (payment.endDate().isBefore(LocalDate.now())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "La vigencia de esta membresía terminó; registra una nueva membresía antes de cobrar.");
        }

        String membershipStatus =
                payment.startDate().isAfter(LocalDate.now()) ? "Programada" : "Activa";
        int updatedPayments = jdbcTemplate.update("""
                UPDATE dbo.Pago
                SET estado_pago = 'Pagado'
                WHERE id_pago = ? AND estado_pago = 'Pendiente'
                """, paymentId);
        int updatedMemberships = jdbcTemplate.update("""
                UPDATE dbo.Membresia
                SET estado = ?
                WHERE id_membresia = (
                    SELECT id_membresia FROM dbo.Pago WHERE id_pago = ?
                )
                  AND estado = 'Pendiente'
                """, membershipStatus, paymentId);
        if (updatedPayments != 1 || updatedMemberships != 1) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No se pudo confirmar el pago y activar la membresía de forma consistente.");
        }
    }

    private record PlanDetails(int durationDays, BigDecimal price) {}

    private record ExistingMembership(
            int clientId,
            int planId,
            String membershipStatus,
            LocalDate endDate,
            String paymentStatus) {}

    private record MembershipCancellation(String membershipStatus, String paymentStatus) {}

    private record PaymentState(
            String paymentStatus,
            String membershipStatus,
            LocalDate startDate,
            LocalDate endDate) {}
}
