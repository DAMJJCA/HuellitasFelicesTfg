package com.veterinaria.demo.dto;

import java.math.BigDecimal;
import java.util.List;

public record FacturaRequest(
        Long idCliente,
        Long idCita,
        BigDecimal impuestoPorcentaje,
        BigDecimal descuentoPorcentaje,
        String notas,
        List<FacturaLineaRequest> lineas) {
}
