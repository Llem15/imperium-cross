package com.imperiumcross.backend.training;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

public record RoutineRequest(
        @NotBlank @Size(max = 40) String nombreRutina,
        @NotBlank @Size(max = 12) String nivel,
        @NotBlank @Size(max = 35) String objetivo,
        @Size(max = 100) String descripcionRutina,
        @NotEmpty @Size(max = 255) List<@Valid RoutineDetailRequest> ejercicios) {
}
