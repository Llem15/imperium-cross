package com.imperiumcross.backend.products;

import java.math.BigDecimal;

public record ProductSummary(
        int idProducto,
        String nombreProducto,
        String descripcionProducto,
        BigDecimal precio,
        String categoria,
        int stock,
        int stockMinimo,
        boolean activo) {
}
