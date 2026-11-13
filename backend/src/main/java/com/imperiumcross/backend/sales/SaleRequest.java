package com.imperiumcross.backend.sales;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record SaleRequest(
        @NotBlank @Size(max = 30) String metodoPago,
        @Positive Integer idCliente,
        @NotEmpty @Valid List<Line> lineas) {

    public record Line(@Positive int idProducto, @Positive @Max(999) int cantidad) {
    }
}