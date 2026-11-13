package com.imperiumcross.backend.training;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ClientRoutineService {

    private final JdbcTemplate jdbcTemplate;

    public ClientRoutineService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public ClientRoutine findByClient(int clientId) {
        List<AssignmentRow> assignments = jdbcTemplate.query("""
                SELECT TOP 1 r.id_rutina, r.nombre_rutina, r.nivel, r.objetivo,
                             r.descripcion_rutina, ar.id_entrenador,
                             CASE
                                 WHEN entrenador.id_usuario IS NULL THEN NULL
                                 ELSE CONCAT(entrenador.nombres, ' ', entrenador.apellidos)
                             END AS nombre_entrenador
                FROM dbo.AsignacionRutina ar
                INNER JOIN dbo.Rutina r ON r.id_rutina = ar.id_rutina
                LEFT JOIN dbo.Usuario entrenador ON entrenador.id_usuario = ar.id_entrenador
                WHERE ar.id_cliente = ? AND ar.estado = 1 AND r.estado = 1
                ORDER BY ar.fecha_asignacion DESC, ar.id_asignacion DESC
                """,
                (rs, rowNum) -> {
                    int trainerId = rs.getInt("id_entrenador");
                    Integer nullableTrainerId = rs.wasNull() ? null : trainerId;
                    return new AssignmentRow(
                            rs.getInt("id_rutina"),
                            rs.getString("nombre_rutina"),
                            rs.getString("nivel"),
                            rs.getString("objetivo"),
                            rs.getString("descripcion_rutina"),
                            nullableTrainerId,
                            rs.getString("nombre_entrenador"));
                },
                clientId);
        if (assignments.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "El cliente no tiene una rutina asignada.");
        }
        AssignmentRow assignment = assignments.get(0);

        List<ClientRoutineExercise> exercises = jdbcTemplate.query("""
                SELECT d.id_ejercicio, e.nombre_ejercicio, e.descripcion_ejercicio,
                       e.grupo_muscular, e.dificultad, d.series, d.repeticiones,
                       d.tiempo, d.descanso
                FROM dbo.DetalleRutina d
                INNER JOIN dbo.Ejercicio e ON e.id_ejercicio = d.id_ejercicio
                WHERE d.id_rutina = ?
                ORDER BY d.orden, d.id_detalle
                """,
                (rs, rowNum) -> new ClientRoutineExercise(
                        rs.getInt("id_ejercicio"),
                        rs.getString("nombre_ejercicio"),
                        rs.getString("descripcion_ejercicio"),
                        rs.getString("grupo_muscular"),
                        rs.getString("dificultad"),
                        nullableInt(rs, "series"),
                        nullableInt(rs, "repeticiones"),
                        nullableInt(rs, "tiempo"),
                        rs.getInt("descanso")),
                assignment.routineId());

        return new ClientRoutine(
                assignment.routineId(),
                assignment.name(),
                assignment.level(),
                assignment.objective(),
                assignment.description(),
                assignment.trainerId(),
                assignment.trainerName(),
                List.copyOf(exercises));
    }

    private static Integer nullableInt(java.sql.ResultSet resultSet, String column)
            throws java.sql.SQLException {
        int value = resultSet.getInt(column);
        return resultSet.wasNull() ? null : value;
    }

    private record AssignmentRow(
            int routineId,
            String name,
            String level,
            String objective,
            String description,
            Integer trainerId,
            String trainerName) {
    }
}