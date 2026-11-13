package com.imperiumcross.backend.clients;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MembershipPaymentSummary(
        int idMembresia,
        int idCliente,
        String nombres,
        String apellidos,
        int idPlan,
        String nombrePlan,
        LocalDate fechaInicio,
        LocalDate fechaFin,
        String estadoMembresia,
        Integer idPago,
        BigDecimal monto,
        String metodoPago,
        String estadoPago) {
}
