package com.imperiumcross.backend.scheduling;

import java.time.LocalTime;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record TrainerShiftRequest(
        @NotNull @Min(1) @Max(6) Integer diaSemana,
        @NotNull LocalTime horaInicio,
        @NotNull LocalTime horaFin) {
}
