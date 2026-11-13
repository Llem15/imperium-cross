package com.imperiumcross.backend.clients;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Pattern;

public record MembershipRequest(
        @Positive int idCliente,
        @Positive int idPlan,
        @NotBlank @Pattern(regexp = "^(Yape|Tarjeta|Efectivo)$") String metodoPago) {
}
