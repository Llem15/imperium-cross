package com.imperiumcross.backend.scheduling;

import java.util.List;

public record TrainerScheduleSummary(
        int idEntrenador,
        String nombreEntrenador,
        List<TrainerShiftSummary> horarios) {
}
