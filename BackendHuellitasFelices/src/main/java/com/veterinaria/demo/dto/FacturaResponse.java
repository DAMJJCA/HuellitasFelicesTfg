package com.veterinaria.demo.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record FacturaResponse(
        Long idFactura,
        Long idCliente,
        String cliente,
        Long idCita,
        String numero,
        LocalDate fecha,
        String estado,
        BigDecimal baseImponible,
        BigDecimal impuestos,
        BigDecimal total,
        String notas,
        LocalDateTime creadoEn,
        List<FacturaLineaResponse> lineas) {
}
