package com.imperiumcross.backend.attendance;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record AttendanceRequest(@NotNull @Positive Integer idCliente) {
}
