package com.imperiumcross.backend.training;

import java.time.LocalDate;
import java.util.List;

public record RoutineSummary(
        int idRutina,
        String nombreRutina,
        String nivel,
        String objetivo,
        String descripcionRutina,
        LocalDate fechaCreacion,
        boolean activo,
        List<RoutineExerciseSummary> ejercicios,
        List<String> clientesAsignados) {
}
