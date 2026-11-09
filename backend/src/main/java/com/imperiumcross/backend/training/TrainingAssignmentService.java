package com.imperiumcross.backend.training;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TrainingAssignmentService {

    private final JdbcTemplate jdbcTemplate;

    public TrainingAssignmentService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public void assignWaitingClientsForObjective(String objective) {
        List<Integer> waitingClients = jdbcTemplate.query("""
                SELECT c.id_cliente
                FROM dbo.Cliente c WITH (UPDLOCK, HOLDLOCK)
                INNER JOIN dbo.Usuario u ON u.id_usuario = c.id_usuario
                WHERE c.estado = 1
                  AND u.estado = 1
                  AND c.objetivo = ?
                  AND NOT EXISTS (
                      SELECT 1
                      FROM dbo.AsignacionRutina ar WITH (UPDLOCK, HOLDLOCK)
                      WHERE ar.id_cliente = c.id_cliente AND ar.estado = 1
                  )
                ORDER BY c.id_cliente
                """,
                (rs, rowNum) -> rs.getInt("id_cliente"),
                objective.trim());
        for (int clientId : waitingClients) {
            assignForObjective(clientId, objective);
        }
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public void assignForObjective(int clientId, String objective) {
        List<Assignment> assignments = jdbcTemplate.query("""
                SELECT TOP 1 id_rutina, id_entrenador
                FROM dbo.AsignacionRutina WITH (UPDLOCK, HOLDLOCK)
                WHERE id_cliente = ? AND estado = 1
                ORDER BY fecha_asignacion DESC, id_asignacion DESC
                """,
                (rs, rowNum) -> new Assignment(
                        rs.getInt("id_rutina"),
                        nullableInt(rs, "id_entrenador")),
                clientId);

        List<Integer> routineIds = jdbcTemplate.query("""
                SELECT TOP 1 id_rutina
                FROM dbo.Rutina
                WHERE estado = 1 AND objetivo = ?
                ORDER BY id_rutina
                """,
                (rs, rowNum) -> rs.getInt("id_rutina"),
                objective.trim());
        if (routineIds.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Todavía no existe una rutina activa para el objetivo seleccionado.");
        }
        int routineId = routineIds.get(0);

        if (!assignments.isEmpty()
                && assignments.get(0).routineId() == routineId
                && isActiveTrainer(assignments.get(0).trainerId())) {
            return;
        }

        deactivateCurrentAssignment(clientId);
        List<Integer> trainerIds = jdbcTemplate.query("""
                SELECT TOP 1 u.id_usuario
                FROM dbo.Usuario u WITH (UPDLOCK, HOLDLOCK)
                INNER JOIN dbo.Rol r ON r.id_rol = u.id_rol AND r.nombre_rol = 'Entrenador'
                LEFT JOIN dbo.AsignacionRutina ar WITH (UPDLOCK, HOLDLOCK)
                    ON ar.id_entrenador = u.id_usuario AND ar.estado = 1
                WHERE u.estado = 1
                GROUP BY u.id_usuario
                ORDER BY COUNT(ar.id_asignacion), u.id_usuario
                """,
                (rs, rowNum) -> rs.getInt("id_usuario"));
        if (trainerIds.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No hay entrenadores activos para asignar la rutina.");
        }

        jdbcTemplate.update("""
                INSERT INTO dbo.AsignacionRutina
                    (id_cliente, id_rutina, id_entrenador, fecha_asignacion, estado)
                VALUES (?, ?, ?, CAST(GETDATE() AS DATE), 1)
                """,
                clientId,
                routineId,
                trainerIds.get(0));
    }

    private boolean isActiveTrainer(Integer trainerId) {
        if (trainerId == null) return false;
        Integer activeCount = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM dbo.Usuario u
                INNER JOIN dbo.Rol r ON r.id_rol = u.id_rol
                WHERE u.id_usuario = ?
                  AND u.estado = 1
                  AND r.nombre_rol = 'Entrenador'
                """,
                Integer.class,
                trainerId);
        return activeCount != null && activeCount > 0;
    }

    private void deactivateCurrentAssignment(int clientId) {
        jdbcTemplate.update(
                "UPDATE dbo.AsignacionRutina SET estado = 0 WHERE id_cliente = ? AND estado = 1",
                clientId);
    }

    private static Integer nullableInt(java.sql.ResultSet resultSet, String column)
            throws java.sql.SQLException {
        int value = resultSet.getInt(column);
        return resultSet.wasNull() ? null : value;
    }

    private record Assignment(int routineId, Integer trainerId) {
    }
}
