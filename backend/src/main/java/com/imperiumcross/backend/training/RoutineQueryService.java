package com.imperiumcross.backend.training;

import java.sql.Types;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.SqlParameterValue;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RoutineQueryService {

    private static final java.util.Set<String> ALLOWED_IMAGE_TYPES =
            java.util.Set.of("image/png", "image/jpeg", "image/webp", "image/gif");
    private static final int MAX_IMAGE_BYTES = 5 * 1024 * 1024;

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
                       dificultad,
                       indicaciones,
                       CASE WHEN imagen IS NULL THEN 0 ELSE 1 END AS tiene_imagen
                FROM dbo.Ejercicio
                WHERE estado = 1
                ORDER BY nombre_ejercicio
                """,
                (rs, rowNum) -> new ExerciseSummary(
                        rs.getInt("id_ejercicio"),
                        rs.getString("nombre_ejercicio"),
                        rs.getString("descripcion_ejercicio"),
                        rs.getString("grupo_muscular"),
                        rs.getString("dificultad"),
                        rs.getString("indicaciones"),
                        rs.getBoolean("tiene_imagen")));
    }

    public ExerciseSummary createExercise(ExerciseRequest request) {
        String name = request.nombreEjercicio().trim();
        String group = request.grupoMuscular().trim();
        String description = nullableDescription(request.descripcionEjercicio());
        String instructions = nullableDescription(request.indicaciones());
        byte[] image = null;
        String imageType = null;
        if (request.imagen() != null && !request.imagen().isBlank()) {
            String raw = request.imagen().trim();
            int separator = raw.indexOf(";base64,");
            if (!raw.startsWith("data:") || separator < 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "La imagen no tiene un formato válido.");
            }
            imageType = raw.substring(5, separator);
            if (!ALLOWED_IMAGE_TYPES.contains(imageType)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "La imagen debe ser PNG, JPG, WebP o GIF.");
            }
            try {
                image = java.util.Base64.getDecoder().decode(raw.substring(separator + 8));
            } catch (IllegalArgumentException exception) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "La imagen no se pudo leer.", exception);
            }
            if (image.length > MAX_IMAGE_BYTES) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "La imagen supera los 5 MB.");
            }
        }
        try {
            Integer id = jdbcTemplate.queryForObject("""
                    INSERT INTO dbo.Ejercicio
                        (nombre_ejercicio, descripcion_ejercicio, grupo_muscular, dificultad,
                         indicaciones, imagen, tipo_imagen)
                    OUTPUT INSERTED.id_ejercicio
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    Integer.class,
                    name,
                    new SqlParameterValue(Types.VARCHAR, description),
                    group,
                    request.dificultad(),
                    new SqlParameterValue(Types.VARCHAR, instructions),
                    new SqlParameterValue(Types.VARBINARY, image),
                    new SqlParameterValue(Types.VARCHAR, imageType));
            if (id == null) {
                throw new IllegalStateException("SQL Server no devolvió el identificador del ejercicio.");
            }
            return new ExerciseSummary(
                    id, name, description, group, request.dificultad(), instructions, image != null);
        } catch (DuplicateKeyException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ya existe un ejercicio con ese nombre.",
                    exception);
        }
    }

    public ExerciseImage findExerciseImage(int id) {
        List<ExerciseImage> rows = jdbcTemplate.query("""
                SELECT imagen, tipo_imagen
                FROM dbo.Ejercicio
                WHERE id_ejercicio = ? AND estado = 1 AND imagen IS NOT NULL
                """,
                (rs, rowNum) -> new ExerciseImage(rs.getBytes("imagen"), rs.getString("tipo_imagen")),
                id);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El ejercicio no tiene imagen.");
        }
        return rows.get(0);
    }

    public List<RoutineSummary> findAll() {
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

        List<RoutineClientRow> clients = jdbcTemplate.query("""
                SELECT ar.id_rutina, CONCAT(u.nombres, ' ', u.apellidos) AS nombre_cliente
                FROM dbo.AsignacionRutina ar
                INNER JOIN dbo.Cliente c ON c.id_cliente = ar.id_cliente
                INNER JOIN dbo.Usuario u ON u.id_usuario = c.id_usuario
                WHERE ar.estado = 1
                ORDER BY ar.id_rutina, u.apellidos, u.nombres
                """,
                (rs, rowNum) -> new RoutineClientRow(
                        rs.getInt("id_rutina"),
                        rs.getString("nombre_cliente")));

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
    public void update(int routineId, RoutineRequest request) {
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
    public void deactivate(int routineId) {
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

    public record ExerciseImage(byte[] data, String type) {
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
