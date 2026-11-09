package com.imperiumcross.backend.attendance;

import java.sql.Date;
import java.time.LocalDate;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AttendanceQueryService {

    private static final String FIND_BY_DATE_SQL = """
            SELECT a.id_asistencia,
                   a.id_cliente,
                   u.nombres,
                   u.apellidos,
                   p.nombre_plan,
                   a.fecha_hora
            FROM dbo.Asistencia a
            INNER JOIN dbo.Cliente c ON c.id_cliente = a.id_cliente
            INNER JOIN dbo.Usuario u ON u.id_usuario = c.id_usuario
            OUTER APPLY (
                SELECT TOP 1 pm.nombre_plan
                FROM dbo.Membresia m
                INNER JOIN dbo.PlanMembresia pm ON pm.id_plan = m.id_plan
                WHERE m.id_cliente = a.id_cliente
                ORDER BY m.fecha_inicio DESC, m.id_membresia DESC
            ) p
            WHERE a.fecha_hora >= ? AND a.fecha_hora < DATEADD(DAY, 1, ?)
            ORDER BY a.fecha_hora DESC, a.id_asistencia DESC
            """;

    private final JdbcTemplate jdbcTemplate;

    public AttendanceQueryService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<AttendanceSummary> findByDate(LocalDate date) {
        Date sqlDate = Date.valueOf(date);
        return jdbcTemplate.query(
                FIND_BY_DATE_SQL,
                (rs, rowNum) -> new AttendanceSummary(
                        rs.getInt("id_asistencia"),
                        rs.getInt("id_cliente"),
                        rs.getString("nombres"),
                        rs.getString("apellidos"),
                        rs.getString("nombre_plan"),
                        rs.getTimestamp("fecha_hora").toLocalDateTime()),
                sqlDate,
                sqlDate);
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public AttendanceSummary register(AttendanceRequest request) {
        Integer eligibleClientCount = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM dbo.Cliente c WITH (UPDLOCK, HOLDLOCK)
                INNER JOIN dbo.Usuario u ON u.id_usuario = c.id_usuario
                INNER JOIN dbo.Membresia m ON m.id_cliente = c.id_cliente
                OUTER APPLY (
                    SELECT TOP 1 p.estado_pago
                    FROM dbo.Pago p
                    WHERE p.id_membresia = m.id_membresia
                    ORDER BY p.id_pago DESC
                ) pago
                WHERE c.id_cliente = ?
                  AND c.estado = 1
                  AND u.estado = 1
                  AND m.estado IN ('Activa', 'Programada')
                  AND m.fecha_inicio <= CAST(GETDATE() AS DATE)
                  AND m.fecha_fin >= CAST(GETDATE() AS DATE)
                  AND pago.estado_pago = 'Pagado'
                """,
                Integer.class,
                request.idCliente());
        if (eligibleClientCount == null || eligibleClientCount == 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "El cliente no tiene una membresía pagada y vigente.");
        }

        Integer duplicateCount = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM dbo.Asistencia WITH (UPDLOCK, HOLDLOCK)
                WHERE id_cliente = ?
                  AND fecha_hora >= CAST(GETDATE() AS DATE)
                  AND fecha_hora < DATEADD(DAY, 1, CAST(GETDATE() AS DATE))
                """,
                Integer.class,
                request.idCliente());
        if (duplicateCount != null && duplicateCount > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Este cliente ya tiene una asistencia registrada hoy.");
        }

        Integer attendanceId = jdbcTemplate.queryForObject("""
                INSERT INTO dbo.Asistencia (id_cliente, fecha_hora, tipo_registro)
                OUTPUT INSERTED.id_asistencia
                VALUES (?, GETDATE(), 'Ingreso')
                """,
                Integer.class,
                request.idCliente());
        if (attendanceId == null) {
            throw new IllegalStateException("SQL Server no devolvió el identificador de asistencia.");
        }
        return jdbcTemplate.queryForObject(
                FIND_BY_ID_SQL,
                (rs, rowNum) -> new AttendanceSummary(
                        rs.getInt("id_asistencia"),
                        rs.getInt("id_cliente"),
                        rs.getString("nombres"),
                        rs.getString("apellidos"),
                        rs.getString("nombre_plan"),
                        rs.getTimestamp("fecha_hora").toLocalDateTime()),
                attendanceId);
    }

    private static final String FIND_BY_ID_SQL = """
            SELECT a.id_asistencia,
                   a.id_cliente,
                   u.nombres,
                   u.apellidos,
                   p.nombre_plan,
                   a.fecha_hora
            FROM dbo.Asistencia a
            INNER JOIN dbo.Cliente c ON c.id_cliente = a.id_cliente
            INNER JOIN dbo.Usuario u ON u.id_usuario = c.id_usuario
            OUTER APPLY (
                SELECT TOP 1 pm.nombre_plan
                FROM dbo.Membresia m
                INNER JOIN dbo.PlanMembresia pm ON pm.id_plan = m.id_plan
                WHERE m.id_cliente = a.id_cliente
                ORDER BY m.fecha_inicio DESC, m.id_membresia DESC
            ) p
            WHERE a.id_asistencia = ?
            """;
}
