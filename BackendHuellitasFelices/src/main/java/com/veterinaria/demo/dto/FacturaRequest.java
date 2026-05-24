package com.veterinaria.demo.dto;

import java.util.List;

public record FacturaRequest(
        Long idCliente,
        Long idCita,
        String notas,
        List<FacturaLineaRequest> lineas) {
}
