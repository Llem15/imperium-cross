package com.imperiumcross.backend.scheduling;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record TrainerScheduleRequest(
        @NotNull List<@Valid TrainerShiftRequest> horarios) {
}
