package com.imperiumcross.backend.training;

public record RoutineExerciseSummary(
        int idDetalle,
        int idEjercicio,
        String nombreEjercicio,
        Integer series,
        Integer repeticiones,
        Integer tiempo,
        int descanso) {
}
