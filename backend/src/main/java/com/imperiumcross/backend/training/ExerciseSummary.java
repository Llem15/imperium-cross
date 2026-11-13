package com.imperiumcross.backend.training;

public record ExerciseSummary(
        int idEjercicio,
        String nombreEjercicio,
        String descripcionEjercicio,
        String grupoMuscular,
        String dificultad,
        String indicaciones,
        boolean tieneImagen) {
}