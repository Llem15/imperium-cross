package com.imperiumcross.backend.scheduling;

import java.time.LocalTime;

public record TrainerShiftSummary(
        int diaSemana,
        LocalTime horaInicio,
        LocalTime horaFin) {
}
