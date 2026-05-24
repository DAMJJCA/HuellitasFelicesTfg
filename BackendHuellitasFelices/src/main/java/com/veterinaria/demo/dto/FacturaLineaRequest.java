package com.veterinaria.demo.dto;

import java.math.BigDecimal;

public record FacturaLineaRequest(
        String concepto,
        BigDecimal cantidad,
        BigDecimal precioUnitario) {
}
