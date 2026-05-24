package com.veterinaria.demo.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.veterinaria.demo.dto.AuditoriaClinicaResponse;
import com.veterinaria.demo.service.AuditoriaClinicaService;

@RestController
@RequestMapping("/api/auditoria-clinica")
public class AuditoriaClinicaController {

    private final AuditoriaClinicaService service;

    public AuditoriaClinicaController(AuditoriaClinicaService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<AuditoriaClinicaResponse> recientes() {
        return service.recientes();
    }
}
