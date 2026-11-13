package com.imperiumcross.backend.training;

import java.util.List;

public record ClientRoutine(
        int idRutina,
        String nombreRutina,
        String nivel,
        String objetivo,
        String descripcionRutina,
        Integer idEntrenador,
        String nombreEntrenador,
        List<ClientRoutineExercise> ejercicios) {
}