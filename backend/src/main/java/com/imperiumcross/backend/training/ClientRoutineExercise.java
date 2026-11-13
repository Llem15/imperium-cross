package com.imperiumcross.backend.training;

public record ClientRoutineExercise(
        int idEjercicio,
        String nombreEjercicio,
        String descripcionEjercicio,
        String grupoMuscular,
        String dificultad,
        Integer series,
        Integer repeticiones,
        Integer tiempo,
        int descanso) {
}