package com.imperiumcross.backend.clients;

import java.math.BigDecimal;

public record MembershipPlanSummary(
        int idPlan,
        String nombrePlan,
        String descripcionPlan,
        int duracionDias,
        BigDecimal precio,
        int horasEntrenamientoSemana,
        int periodoCambioHorarioDias,
        boolean activo) {
}
