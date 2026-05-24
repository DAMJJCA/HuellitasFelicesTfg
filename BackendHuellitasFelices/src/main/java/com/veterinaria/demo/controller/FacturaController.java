package com.veterinaria.demo.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.veterinaria.demo.dto.FacturaRequest;
import com.veterinaria.demo.dto.FacturaResponse;
import com.veterinaria.demo.service.FacturaService;

@RestController
@RequestMapping("/api/facturas")
@PreAuthorize("hasAnyRole('ADMIN', 'RECEPCION')")
public class FacturaController {

    private final FacturaService facturaService;

    public FacturaController(FacturaService facturaService) {
        this.facturaService = facturaService;
    }

    @GetMapping
    public List<FacturaResponse> listar() {
        return facturaService.listar();
    }

    @GetMapping("/{id}")
    public FacturaResponse obtener(@PathVariable Long id) {
        return facturaService.obtener(id);
    }

    @PostMapping
    public FacturaResponse crear(@RequestBody FacturaRequest request) {
        return facturaService.crear(request);
    }

    @PatchMapping("/{id}/estado")
    public FacturaResponse cambiarEstado(@PathVariable Long id, @RequestBody FacturaEstadoRequest request) {
        return facturaService.cambiarEstado(id, request.estado());
    }

    public record FacturaEstadoRequest(String estado) {
    }
}
