package com.imperiumcross.backend.dashboard;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class DashboardQueryService {

    private static final String INCOME_SQL = """
            SELECT anio, mes, SUM(total) AS total
            FROM (
                SELECT YEAR(fecha_pago) AS anio, MONTH(fecha_pago) AS mes, monto AS total
                FROM dbo.Pago
                WHERE estado_pago = 'Pagado'
                  AND fecha_pago >= DATEADD(MONTH, -11, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
                UNION ALL
                SELECT YEAR(fecha_venta), MONTH(fecha_venta), total
                FROM dbo.Venta
                WHERE fecha_venta >= DATEADD(MONTH, -11, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
            ) ingresos
            GROUP BY anio, mes
            ORDER BY anio, mes
            """;

    private static final String ACTIVITY_SQL = """
            SELECT TOP 4 titulo, detalle, fecha
            FROM (
                SELECT 'Nuevo cliente' AS titulo,
                       CONCAT(u.nombres, ' ', u.apellidos) AS detalle,
                       CAST(c.fecha_registro AS DATETIME2) AS fecha
                FROM dbo.Cliente c
                INNER JOIN dbo.Usuario u ON u.id_usuario = c.id_usuario
                UNION ALL
                SELECT 'Pago registrado',
                       CONCAT(u.nombres, ' ', u.apellidos, ' - ', pl.nombre_plan),
                       CAST(pg.fecha_pago AS DATETIME2)
                FROM dbo.Pago pg
                INNER JOIN dbo.Membresia m ON m.id_membresia = pg.id_membresia
                INNER JOIN dbo.Cliente c ON c.id_cliente = m.id_cliente
                INNER JOIN dbo.Usuario u ON u.id_usuario = c.id_usuario
                INNER JOIN dbo.PlanMembresia pl ON pl.id_plan = m.id_plan
                WHERE pg.estado_pago = 'Pagado'
                UNION ALL
                SELECT 'Venta registrada',
                       CONCAT(COALESCE(NULLIF(LTRIM(RTRIM(CONCAT(u.nombres, ' ', u.apellidos))), ''), 'Venta en mostrador'),
                              ' - S/ ', CONVERT(VARCHAR(20), v.total)),
                       CAST(v.fecha_venta AS DATETIME2)
                FROM dbo.Venta v
                LEFT JOIN dbo.Cliente c ON c.id_cliente = v.id_cliente
                LEFT JOIN dbo.Usuario u ON u.id_usuario = c.id_usuario
                UNION ALL
                SELECT 'Rutina asignada',
                       CONCAT(u.nombres, ' ', u.apellidos),
                       CAST(ar.fecha_asignacion AS DATETIME2)
                FROM dbo.AsignacionRutina ar
                INNER JOIN dbo.Cliente c ON c.id_cliente = ar.id_cliente
                INNER JOIN dbo.Usuario u ON u.id_usuario = c.id_usuario
            ) actividad
            WHERE fecha IS NOT NULL
            ORDER BY fecha DESC
            """;

    private final JdbcTemplate jdbcTemplate;

    public DashboardQueryService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public DashboardSummary summary() {
        List<DashboardSummary.MonthlyIncome> income = jdbcTemplate.query(
                INCOME_SQL,
                (rs, rowNum) -> new DashboardSummary.MonthlyIncome(
                        rs.getInt("anio"), rs.getInt("mes"), rs.getBigDecimal("total")));
        List<DashboardSummary.Activity> activity = jdbcTemplate.query(
                ACTIVITY_SQL,
                (rs, rowNum) -> new DashboardSummary.Activity(
                        rs.getString("titulo"),
                        rs.getString("detalle"),
                        rs.getTimestamp("fecha").toLocalDateTime().toString()));
        return new DashboardSummary(income, activity);
    }
}