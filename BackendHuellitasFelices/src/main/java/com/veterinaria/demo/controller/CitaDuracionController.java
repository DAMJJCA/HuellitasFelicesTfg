package com.veterinaria.demo.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.veterinaria.demo.dto.CitaDuracionRequest;
import com.veterinaria.demo.dto.CitaDuracionResponse;
import com.veterinaria.demo.service.CitaDuracionService;

@RestController
@RequestMapping("/api/citas-duraciones")
public class CitaDuracionController {

    private final CitaDuracionService service;

    public CitaDuracionController(CitaDuracionService service) {
        this.service = service;
    }

    @GetMapping
    public List<CitaDuracionResponse> listar() {
        return service.findAll();
    }

    @GetMapping("/{idCita}")
    public CitaDuracionResponse obtener(@PathVariable Long idCita) {
        return service.findByCita(idCita);
    }

    @PutMapping("/{idCita}")
    @PreAuthorize("hasAnyRole('ADMIN','CLIENTE')")
    public CitaDuracionResponse guardar(@PathVariable Long idCita, @RequestBody CitaDuracionRequest request) {
        return service.save(idCita, request);
    }
}
