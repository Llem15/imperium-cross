package com.imperiumcross.backend.dashboard;

import java.math.BigDecimal;
import java.util.List;

public record DashboardSummary(List<MonthlyIncome> ingresosMensuales, List<Activity> actividad) {

    public record MonthlyIncome(int anio, int mes, BigDecimal total) {
    }

    public record Activity(String titulo, String detalle, String fecha) {
    }
}