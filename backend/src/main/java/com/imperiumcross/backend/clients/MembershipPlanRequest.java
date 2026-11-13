package com.imperiumcross.backend.clients;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record MembershipPlanRequest(
        @NotBlank @Size(max = 20) String nombrePlan,
        @Size(max = 100) String descripcionPlan,
        @Positive @Max(32767) @NotNull Integer duracionDias,
        @NotNull @DecimalMin("0.00") @DecimalMax("9999.99") @Digits(integer = 4, fraction = 2) BigDecimal precio,
        @NotNull @Min(0) @Max(7) Integer horasEntrenamientoSemana,
        @NotNull @Min(0) @Max(30) Integer periodoCambioHorarioDias,
        @NotNull Boolean activo) {
}
