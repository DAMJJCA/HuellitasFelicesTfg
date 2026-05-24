package com.veterinaria.demo.dto;

import java.math.BigDecimal;

public record FacturaLineaResponse(
        Long idLinea,
        String concepto,
        BigDecimal cantidad,
        BigDecimal precioUnitario,
        BigDecimal total) {
}
