package com.imperiumcross.backend.scheduling;

import java.time.LocalDate;
import java.time.LocalTime;

public record TrainingReservationSummary(
        int idReserva,
        int idMembresia,
        int idCliente,
        String nombreCliente,
        int idEntrenador,
        String nombreEntrenador,
        int diaSemana,
        LocalTime horaInicio,
        LocalDate fechaInicio,
        LocalDate fechaFin,
        String estado,
        int sesionesReservadas,
        int periodoCambioHorarioDias,
        LocalDate fechaUltimoCambio,
        LocalDate fechaSiguienteCambio,
        boolean puedeCambiarHorario) {
}
