package com.imperiumcross.backend.scheduling;

import java.time.LocalDate;
import java.util.List;

public record TrainingReservationAvailability(
        int idMembresia,
        LocalDate fechaInicio,
        LocalDate fechaFin,
        int horasSemanales,
        int reservasActivas,
        int reservasDisponibles,
        int periodoCambioHorarioDias,
        List<TrainingAvailableSlot> horarios) {
}
