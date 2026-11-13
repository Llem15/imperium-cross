package com.imperiumcross.backend.attendance;

import java.time.LocalDateTime;

public record AttendanceSummary(
        int idAsistencia,
        int idCliente,
        String nombres,
        String apellidos,
        String nombrePlan,
        LocalDateTime fechaHora) {
}
