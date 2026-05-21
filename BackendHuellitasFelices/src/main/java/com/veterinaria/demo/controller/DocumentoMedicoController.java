package com.veterinaria.demo.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.veterinaria.demo.dto.DocumentoMedicoRequest;
import com.veterinaria.demo.dto.DocumentoMedicoResponse;
import com.veterinaria.demo.service.DocumentoMedicoService;

@RestController
@RequestMapping("/api/documentos-medicos")
@CrossOrigin(origins = "*")
public class DocumentoMedicoController {

    private final DocumentoMedicoService service;

    public DocumentoMedicoController(DocumentoMedicoService service) {
        this.service = service;
    }

    @GetMapping
    public List<DocumentoMedicoResponse> listar() {
        return service.findAll();
    }

    @GetMapping("/mascota/{idMascota}")
    public List<DocumentoMedicoResponse> listarPorMascota(@PathVariable Long idMascota) {
        return service.findByMascota(idMascota);
    }

    @GetMapping("/{id}")
    public DocumentoMedicoResponse obtener(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'VETERINARIO')")
    public DocumentoMedicoResponse crear(@RequestBody DocumentoMedicoRequest request) {
        return service.save(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'VETERINARIO')")
    public DocumentoMedicoResponse editar(@PathVariable Long id, @RequestBody DocumentoMedicoRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'VETERINARIO')")
    public void eliminar(@PathVariable Long id) {
        service.deleteById(id);
    }
}
