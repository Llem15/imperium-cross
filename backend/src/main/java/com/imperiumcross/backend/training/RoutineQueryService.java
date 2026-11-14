package com.imperiumcross.backend.training;

import java.sql.Types;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.SqlParameterValue;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RoutineQueryService {

    private final JdbcTemplate jdbcTemplate;
    private final TrainingAssignmentService trainingAssignmentService;

    public RoutineQueryService(
            JdbcTemplate jdbcTemplate,
            TrainingAssignmentService trainingAssignmentService) {
        this.jdbcTemplate = jdbcTemplate;
        this.trainingAssignmentService = trainingAssignmentService;
    }

    public List<ExerciseSummary> findExercises() {
        return jdbcTemplate.query("""
                SELECT id_ejercicio,
                       nombre_ejercicio,
                       descripcion_ejercicio,
                       grupo_muscular,
                       dificultad
                FROM dbo.Ejercicio
                WHERE estado = 1
                ORDER BY nombre_ejercicio
                """,
                (rs, rowNum) -> new ExerciseSummary(
                        rs.getInt("id_ejercicio"),
                        rs.getString("nombre_ejercicio"),
                        rs.getString("descripcion_ejercicio"),
                        rs.getString("grupo_muscular"),
                        rs.getString("dificultad")));
    }

    public List<RoutineSummary> findAll(Integer trainerUserId) {
        List<RoutineRow> routines = jdbcTemplate.query("""
                SELECT id_rutina, nombre_rutina, nivel, objetivo, descripcion_rutina,
                       fecha_creacion, estado
                FROM dbo.Rutina
                ORDER BY estado DESC, nombre_rutina
                """,
                (rs, rowNum) -> new RoutineRow(
                        rs.getInt("id_rutina"),
                        rs.getString("nombre_rutina"),
                        rs.getString("nivel"),
                        rs.getString("objetivo"),
                        rs.getString("descripcion_rutina"),
                        rs.getDate("fecha_creacion").toLocalDate(),
                        rs.getBoolean("estado")));
        if (routines.isEmpty()) return List.of();

        List<RoutineExerciseRow> exercises = jdbcTemplate.query("""
                SELECT d.id_rutina, d.id_detalle, d.id_ejercicio, e.nombre_ejercicio,
                       d.series, d.repeticiones, d.tiempo, d.descanso
                FROM dbo.DetalleRutina d
                INNER JOIN dbo.Ejercicio e ON e.id_ejercicio = d.id_ejercicio
                ORDER BY d.id_rutina, d.orden, d.id_detalle
                """,
                (rs, rowNum) -> new RoutineExerciseRow(
                        rs.getInt("id_rutina"),
                        new RoutineExerciseSummary(
                                rs.getInt("id_detalle"),
                                rs.getInt("id_ejercicio"),
                                rs.getString("nombre_ejercicio"),
                                nullableInt(rs, "series"),
                                nullableInt(rs, "repeticiones"),
                                nullableInt(rs, "tiempo"),
                                rs.getInt("descanso"))));

        String clientSql = """
                SELECT ar.id_rutina, CONCAT(u.nombres, ' ', u.apellidos) AS nombre_cliente
                FROM dbo.AsignacionRutina ar
                INNER JOIN dbo.Cliente c ON c.id_cliente = ar.id_cliente
                INNER JOIN dbo.Usuario u ON u.id_usuario = c.id_usuario
                WHERE ar.estado = 1 AND ar.id_entrenador = ?
                ORDER BY ar.id_rutina, u.apellidos, u.nombres
                """;
        String allClientSql = """
                SELECT ar.id_rutina, CONCAT(u.nombres, ' ', u.apellidos) AS nombre_cliente
                FROM dbo.AsignacionRutina ar
                INNER JOIN dbo.Cliente c ON c.id_cliente = ar.id_cliente
                INNER JOIN dbo.Usuario u ON u.id_usuario = c.id_usuario
                WHERE ar.estado = 1
                ORDER BY ar.id_rutina, u.apellidos, u.nombres
                """;
        var clientMapper = (org.springframework.jdbc.core.RowMapper<RoutineClientRow>) (rs, rowNum) ->
                new RoutineClientRow(rs.getInt("id_rutina"), rs.getString("nombre_cliente"));
        List<RoutineClientRow> clients = trainerUserId == null
                ? jdbcTemplate.query(allClientSql, clientMapper)
                : jdbcTemplate.query(clientSql, clientMapper, trainerUserId);

        Map<Integer, List<RoutineExerciseSummary>> exercisesByRoutine = new HashMap<>();
        exercises.forEach(row -> exercisesByRoutine
                .computeIfAbsent(row.routineId(), ignored -> new ArrayList<>())
                .add(row.exercise()));
        Map<Integer, List<String>> clientsByRoutine = new HashMap<>();
        clients.forEach(row -> clientsByRoutine
                .computeIfAbsent(row.routineId(), ignored -> new ArrayList<>())
                .add(row.clientName()));

        return routines.stream()
                .map(routine -> new RoutineSummary(
                        routine.id(),
                        routine.name(),
                        routine.level(),
                        routine.objective(),
                        routine.description(),
                        routine.createdOn(),
                        routine.active(),
                        List.copyOf(exercisesByRoutine.getOrDefault(routine.id(), List.of())),
                        List.copyOf(clientsByRoutine.getOrDefault(routine.id(), List.of()))))
                .toList();
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public void create(RoutineRequest request) {
        try {
            Integer routineId = jdbcTemplate.queryForObject("""
                    INSERT INTO dbo.Rutina
                        (nombre_rutina, nivel, objetivo, descripcion_rutina)
                    OUTPUT INSERTED.id_rutina
                    VALUES (?, ?, ?, ?)
                    """,
                    Integer.class,
                    request.nombreRutina().trim(),
                    request.nivel().trim(),
                    request.objetivo().trim(),
                    nullableDescription(request.descripcionRutina()));
            if (routineId == null) {
                throw new IllegalStateException("SQL Server no devolvió el identificador de rutina.");
            }
            replaceExercises(routineId, request.ejercicios());
            trainingAssignmentService.assignWaitingClientsForObjective(request.objetivo());
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La rutina contiene ejercicios inexistentes o datos fuera de los límites del esquema.",
                    exception);
        }
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public void update(int routineId, RoutineRequest request, Integer trainerUserId) {
        assertTrainerOwnsAssignments(routineId, trainerUserId);
        List<String> currentObjectives = jdbcTemplate.query("""
                SELECT objetivo
                FROM dbo.Rutina WITH (UPDLOCK, HOLDLOCK)
                WHERE id_rutina = ? AND estado = 1
                """,
                (rs, rowNum) -> rs.getString("objetivo"),
                routineId);
        if (currentObjectives.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró la rutina activa.");
        }
        String currentObjective = currentObjectives.get(0);
        Integer assignedClientCount = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM dbo.AsignacionRutina
                WHERE id_rutina = ? AND estado = 1
                """,
                Integer.class,
                routineId);
        if (assignedClientCount != null
                && assignedClientCount > 0
                && !currentObjective.equalsIgnoreCase(request.objetivo().trim())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No se puede cambiar el objetivo de una rutina asignada; crea una rutina nueva para ese objetivo.");
        }

        try {
            jdbcTemplate.update("""
                    UPDATE dbo.Rutina
                    SET nombre_rutina = ?, nivel = ?, objetivo = ?, descripcion_rutina = ?
                    WHERE id_rutina = ?
                    """,
                    request.nombreRutina().trim(),
                    request.nivel().trim(),
                    request.objetivo().trim(),
                    nullableDescription(request.descripcionRutina()),
                    routineId);
            jdbcTemplate.update("DELETE FROM dbo.DetalleRutina WHERE id_rutina = ?", routineId);
            replaceExercises(routineId, request.ejercicios());
            trainingAssignmentService.assignWaitingClientsForObjective(request.objetivo());
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La rutina contiene ejercicios inexistentes o datos fuera de los límites del esquema.",
                    exception);
        }
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public void deactivate(int routineId, Integer trainerUserId) {
        assertTrainerOwnsAssignments(routineId, trainerUserId);
        List<String> objectives = jdbcTemplate.query("""
                SELECT objetivo
                FROM dbo.Rutina WITH (UPDLOCK, HOLDLOCK)
                WHERE id_rutina = ? AND estado = 1
                """,
                (rs, rowNum) -> rs.getString("objetivo"),
                routineId);
        if (objectives.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró la rutina activa.");
        }
        List<Integer> assignedClients = jdbcTemplate.query("""
                SELECT id_cliente
                FROM dbo.AsignacionRutina
                WHERE id_rutina = ? AND estado = 1
                """,
                (rs, rowNum) -> rs.getInt("id_cliente"),
                routineId);
        jdbcTemplate.update("UPDATE dbo.Rutina SET estado = 0 WHERE id_rutina = ?", routineId);
        jdbcTemplate.update(
                "UPDATE dbo.AsignacionRutina SET estado = 0 WHERE id_rutina = ? AND estado = 1",
                routineId);
        assignedClients.forEach(clientId -> {
            String objective = jdbcTemplate.queryForObject(
                    "SELECT objetivo FROM dbo.Cliente WHERE id_cliente = ?",
                    String.class,
                    clientId);
            if (objective != null) {
                trainingAssignmentService.assignForObjective(clientId, objective);
            }
        });
    }

    private void replaceExercises(int routineId, List<RoutineDetailRequest> exercises) {
        for (int index = 0; index < exercises.size(); index++) {
            RoutineDetailRequest exercise = exercises.get(index);
            jdbcTemplate.update("""
                    INSERT INTO dbo.DetalleRutina
                        (id_rutina, id_ejercicio, series, repeticiones, tiempo, descanso, orden)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    routineId,
                    exercise.idEjercicio(),
                    nullableSmallInt(exercise.series()),
                    nullableSmallInt(exercise.repeticiones()),
                    nullableSmallInt(exercise.tiempo()),
                    exercise.descanso(),
                    index + 1);
        }
    }

    private void assertTrainerOwnsAssignments(int routineId, Integer trainerUserId) {
        if (trainerUserId == null) return;
        Integer assignmentsOwnedByOthers = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM dbo.AsignacionRutina
                WHERE id_rutina = ?
                  AND estado = 1
                  AND (id_entrenador IS NULL OR id_entrenador <> ?)
                """,
                Integer.class,
                routineId,
                trainerUserId);
        if (assignmentsOwnedByOthers != null && assignmentsOwnedByOthers > 0) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "No puedes modificar una rutina asignada a clientes de otro entrenador.");
        }
    }

    private static Integer nullableInt(java.sql.ResultSet resultSet, String column)
            throws java.sql.SQLException {
        int value = resultSet.getInt(column);
        return resultSet.wasNull() ? null : value;
    }

    private static SqlParameterValue nullableSmallInt(Integer value) {
        return new SqlParameterValue(Types.SMALLINT, value);
    }

    private static String nullableDescription(String description) {
        return description == null || description.isBlank() ? null : description.trim();
    }

    private record RoutineRow(
            int id,
            String name,
            String level,
            String objective,
            String description,
            java.time.LocalDate createdOn,
            boolean active) {
    }

    private record RoutineExerciseRow(int routineId, RoutineExerciseSummary exercise) {
    }

    private record RoutineClientRow(int routineId, String clientName) {
    }
}
