package com.imperiumcross.backend.sales;

import java.math.BigDecimal;

public record SaleReceipt(int idVenta, String serie, int numero, BigDecimal total) {
}