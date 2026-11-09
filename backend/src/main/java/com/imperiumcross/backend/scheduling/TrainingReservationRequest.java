package com.imperiumcross.backend.scheduling;

import java.time.LocalTime;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record TrainingReservationRequest(
        @Positive int idMembresia,
        @NotNull @Min(1) @Max(6) Integer diaSemana,
        @NotNull LocalTime horaInicio) {
}
