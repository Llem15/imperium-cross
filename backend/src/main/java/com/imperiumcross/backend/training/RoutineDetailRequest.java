package com.imperiumcross.backend.training;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public record RoutineDetailRequest(
        @Positive Integer idEjercicio,
        @PositiveOrZero @Max(255) Integer series,
        @PositiveOrZero @Max(32767) Integer repeticiones,
        @PositiveOrZero @Max(32767) Integer tiempo,
        @PositiveOrZero @Max(32767) Integer descanso) {

    @jakarta.validation.constraints.AssertTrue(message = "Indica series y repeticiones, o un tiempo.")
    public boolean isPrescriptionValid() {
        if (idEjercicio == null || descanso == null) return false;
        boolean repetitionsBased = series != null && series > 0
                && repeticiones != null && repeticiones > 0 && tiempo == null;
        boolean timeBased = series == null && repeticiones == null && tiempo != null && tiempo > 0;
        return repetitionsBased || timeBased;
    }
}
