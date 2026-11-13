package com.imperiumcross.backend.products;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record ProductRequest(
        @NotBlank @Size(max = 40) String nombreProducto,
        @Size(max = 100) String descripcionProducto,
        @NotNull @DecimalMin("0.00") @DecimalMax("9999.99") @Digits(integer = 4, fraction = 2) BigDecimal precio,
        @NotBlank @Size(max = 15) String categoria,
        @NotNull @PositiveOrZero @Max(32767) Integer stock,
        @NotNull @PositiveOrZero @Max(32767) Integer stockMinimo,
        @NotNull Boolean activo,
        @Size(max = 8000000) String imagen) {
}
