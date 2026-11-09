package com.imperiumcross.backend.scheduling;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TrainerScheduleQueryService {

    private final JdbcTemplate jdbcTemplate;

    public TrainerScheduleQueryService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<TrainerScheduleSummary> findAll() {
        List<TrainerRow> trainers = jdbcTemplate.query("""
                SELECT u.id_usuario, CONCAT(u.nombres, ' ', u.apellidos) AS nombre_entrenador
                FROM dbo.Usuario u
                INNER JOIN dbo.Rol r ON r.id_rol = u.id_rol
                WHERE u.estado = 1 AND r.nombre_rol = 'Entrenador'
                ORDER BY u.apellidos, u.nombres, u.id_usuario
                """,
                (rs, rowNum) -> new TrainerRow(
                        rs.getInt("id_usuario"),
                        rs.getString("nombre_entrenador")));

        List<ShiftRow> shifts = jdbcTemplate.query("""
                SELECT h.id_entrenador, h.dia_semana, h.hora_inicio, h.hora_fin
                FROM dbo.HorarioEntrenador h
                INNER JOIN dbo.Usuario u ON u.id_usuario = h.id_entrenador AND u.estado = 1
                INNER JOIN dbo.Rol r ON r.id_rol = u.id_rol AND r.nombre_rol = 'Entrenador'
                WHERE h.estado = 1
                ORDER BY h.id_entrenador, h.dia_semana, h.hora_inicio
                """,
                (rs, rowNum) -> new ShiftRow(
                        rs.getInt("id_entrenador"),
                        new TrainerShiftSummary(
                                rs.getInt("dia_semana"),
                                rs.getTime("hora_inicio").toLocalTime(),
                                rs.getTime("hora_fin").toLocalTime())));

        return trainers.stream()
                .map(trainer -> new TrainerScheduleSummary(
                        trainer.id(),
                        trainer.name(),
                        shifts.stream()
                                .filter(shift -> shift.trainerId() == trainer.id())
                                .map(ShiftRow::shift)
                                .toList()))
                .toList();
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public void replaceSchedule(int trainerId, TrainerScheduleRequest request) {
        ensureActiveTrainer(trainerId);
        validateShifts(request.horarios());

        jdbcTemplate.update("""
                DELETE FROM dbo.HorarioEntrenador
                WHERE id_entrenador = ?
                """,
                trainerId);

        for (TrainerShiftRequest shift : request.horarios()) {
            jdbcTemplate.update("""
                    INSERT INTO dbo.HorarioEntrenador
                        (id_entrenador, dia_semana, hora_inicio, hora_fin, estado)
                    VALUES (?, ?, ?, ?, 1)
                    """,
                    trainerId,
                    shift.diaSemana(),
                    shift.horaInicio(),
                    shift.horaFin());
        }
    }

    private void ensureActiveTrainer(int trainerId) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM dbo.Usuario u
                INNER JOIN dbo.Rol r ON r.id_rol = u.id_rol
                WHERE u.id_usuario = ? AND u.estado = 1 AND r.nombre_rol = 'Entrenador'
                """,
                Integer.class,
                trainerId);
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró un entrenador activo.");
        }
    }

    private static void validateShifts(List<TrainerShiftRequest> shifts) {
        List<TrainerShiftRequest> sortedShifts = new ArrayList<>(shifts);
        sortedShifts.sort(Comparator
                .comparing(TrainerShiftRequest::diaSemana)
                .thenComparing(TrainerShiftRequest::horaInicio));
        for (int index = 0; index < sortedShifts.size(); index++) {
            TrainerShiftRequest current = sortedShifts.get(index);
            if (!current.horaInicio().isBefore(current.horaFin())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "La hora de inicio debe ser anterior a la hora de fin.");
            }
            if (index > 0) {
                TrainerShiftRequest previous = sortedShifts.get(index - 1);
                if (previous.diaSemana().equals(current.diaSemana())
                        && current.horaInicio().isBefore(previous.horaFin())) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Los turnos de un entrenador no pueden superponerse.");
                }
            }
        }
    }

    private record TrainerRow(int id, String name) {
    }

    private record ShiftRow(int trainerId, TrainerShiftSummary shift) {
    }
}
