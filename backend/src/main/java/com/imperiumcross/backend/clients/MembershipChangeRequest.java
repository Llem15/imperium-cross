package com.imperiumcross.backend.clients;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

public record MembershipChangeRequest(
        @Positive int idPlan,
        @NotBlank @Pattern(regexp = "^(Yape|Tarjeta|Efectivo)$") String metodoPago,
        @NotBlank @Pattern(regexp = "^(Inmediato|AlVencimiento)$") String vigencia) {
}
