package com.veterinaria.demo.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.veterinaria.demo.dto.UsuarioInternoRequest;
import com.veterinaria.demo.dto.UsuarioResponse;
import com.veterinaria.demo.service.UsuarioAdminService;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioAdminController {

    private final UsuarioAdminService usuarioAdminService;

    public UsuarioAdminController(UsuarioAdminService usuarioAdminService) {
        this.usuarioAdminService = usuarioAdminService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPCION')")
    public List<UsuarioResponse> listar() {
        return usuarioAdminService.listar();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public UsuarioResponse crear(@RequestBody UsuarioInternoRequest request) {
        return usuarioAdminService.crearInterno(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UsuarioResponse actualizar(@PathVariable Long id, @RequestBody UsuarioInternoRequest request) {
        return usuarioAdminService.actualizarInterno(id, request);
    }

    @PatchMapping("/{id}/activo")
    @PreAuthorize("hasRole('ADMIN')")
    public UsuarioResponse cambiarActivo(@PathVariable Long id, @RequestBody UsuarioActivoRequest request) {
        return usuarioAdminService.cambiarActivo(id, request.activo());
    }

    public record UsuarioActivoRequest(boolean activo) {
    }
}
