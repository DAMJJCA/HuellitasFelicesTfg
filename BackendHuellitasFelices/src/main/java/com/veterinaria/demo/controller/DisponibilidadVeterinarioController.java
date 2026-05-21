package com.veterinaria.demo.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.veterinaria.demo.dto.DisponibilidadVeterinarioRequest;
import com.veterinaria.demo.dto.DisponibilidadVeterinarioResponse;
import com.veterinaria.demo.service.DisponibilidadVeterinarioService;

@RestController
@RequestMapping("/api/disponibilidad-veterinarios")
public class DisponibilidadVeterinarioController {

    private final DisponibilidadVeterinarioService service;

    public DisponibilidadVeterinarioController(DisponibilidadVeterinarioService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','VETERINARIO','CLIENTE')")
    public List<DisponibilidadVeterinarioResponse> listar() {
        return service.findAll();
    }

    @GetMapping("/veterinario/{idVeterinario}")
    @PreAuthorize("hasAnyRole('ADMIN','VETERINARIO','CLIENTE')")
    public List<DisponibilidadVeterinarioResponse> porVeterinario(@PathVariable Long idVeterinario) {
        return service.findByVeterinario(idVeterinario);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public DisponibilidadVeterinarioResponse crear(@RequestBody DisponibilidadVeterinarioRequest request) {
        return service.save(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public DisponibilidadVeterinarioResponse editar(@PathVariable Long id, @RequestBody DisponibilidadVeterinarioRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void eliminar(@PathVariable Long id) {
        service.delete(id);
    }
}
