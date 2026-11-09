package com.imperiumcross.backend.clients;

import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MembershipPlanQueryService {

    private final JdbcTemplate jdbcTemplate;

    public MembershipPlanQueryService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<MembershipPlanSummary> findAll() {
        return jdbcTemplate.query("""
                SELECT id_plan, nombre_plan, descripcion_plan, duracion_dias, precio,
                       horas_entrenamiento_semana, periodo_cambio_horario_dias, estado
                FROM dbo.PlanMembresia
                ORDER BY estado DESC, nombre_plan
                """,
                (rs, rowNum) -> new MembershipPlanSummary(
                        rs.getInt("id_plan"),
                        rs.getString("nombre_plan"),
                        rs.getString("descripcion_plan"),
                        rs.getInt("duracion_dias"),
                        rs.getBigDecimal("precio"),
                        rs.getInt("horas_entrenamiento_semana"),
                        rs.getInt("periodo_cambio_horario_dias"),
                        rs.getBoolean("estado")));
    }

    @Transactional
    public void create(MembershipPlanRequest request) {
        ensureUniqueName(request.nombrePlan(), null);
        try {
            jdbcTemplate.update("""
                    INSERT INTO dbo.PlanMembresia
                        (nombre_plan, descripcion_plan, duracion_dias, precio,
                         horas_entrenamiento_semana, periodo_cambio_horario_dias, estado)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    request.nombrePlan().trim(),
                    nullableDescription(request.descripcionPlan()),
                    request.duracionDias(),
                    request.precio(),
                    request.horasEntrenamientoSemana(),
                    request.periodoCambioHorarioDias(),
                    request.activo());
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Los datos del plan no cumplen las restricciones de la base de datos.",
                    exception);
        }
    }

    @Transactional
    public void update(int planId, MembershipPlanRequest request) {
        ensureUniqueName(request.nombrePlan(), planId);
        Integer membershipCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM dbo.Membresia WHERE id_plan = ?",
                Integer.class,
                planId);
        if (membershipCount == null || membershipCount == 0) {
            updatePlan(planId, request);
            return;
        }

        String currentName = jdbcTemplate.queryForObject(
                "SELECT nombre_plan FROM dbo.PlanMembresia WHERE id_plan = ?",
                String.class,
                planId);
        if (currentName == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró el plan.");
        }
        if (!currentName.trim().equals(request.nombrePlan().trim())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No se puede renombrar un plan con matrículas asociadas. Crea otro plan y desactiva este.");
        }
        updatePlan(planId, request);
    }

    private void updatePlan(int planId, MembershipPlanRequest request) {
        try {
            int updatedPlans = jdbcTemplate.update("""
                    UPDATE dbo.PlanMembresia
                    SET nombre_plan = ?,
                        descripcion_plan = ?,
                        duracion_dias = ?,
                        precio = ?,
                        horas_entrenamiento_semana = ?,
                        periodo_cambio_horario_dias = ?,
                        estado = ?
                    WHERE id_plan = ?
                    """,
                    request.nombrePlan().trim(),
                    nullableDescription(request.descripcionPlan()),
                    request.duracionDias(),
                    request.precio(),
                    request.horasEntrenamientoSemana(),
                    request.periodoCambioHorarioDias(),
                    request.activo(),
                    planId);
            if (updatedPlans == 0) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró el plan.");
            }
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Los datos del plan no cumplen las restricciones de la base de datos.",
                    exception);
        }
    }

    private void ensureUniqueName(String planName, Integer currentPlanId) {
        Integer duplicateCount = currentPlanId == null
                ? jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM dbo.PlanMembresia WHERE nombre_plan = ?",
                        Integer.class,
                        planName.trim())
                : jdbcTemplate.queryForObject("""
                        SELECT COUNT(*)
                        FROM dbo.PlanMembresia
                        WHERE nombre_plan = ? AND id_plan <> ?
                        """,
                        Integer.class,
                        planName.trim(),
                        currentPlanId);
        if (duplicateCount != null && duplicateCount > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ya existe un plan con ese nombre.");
        }
    }

    private static String nullableDescription(String description) {
        return description == null || description.isBlank() ? null : description.trim();
    }
}
