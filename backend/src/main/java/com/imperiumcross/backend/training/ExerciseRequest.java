package com.imperiumcross.backend.training;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ExerciseRequest(
        @NotBlank @Size(max = 30) String nombreEjercicio,
        @Size(max = 120) String descripcionEjercicio,
        @Size(max = 300) String indicaciones,
        @NotBlank @Size(max = 25) String grupoMuscular,
        @NotBlank @Pattern(regexp = "Basico|Intermedio|Avanzado") String dificultad,
        @Size(max = 8000000) String imagen) {
}