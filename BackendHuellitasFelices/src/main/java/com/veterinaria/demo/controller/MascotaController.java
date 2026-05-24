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

import com.veterinaria.demo.model.Mascota;
import com.veterinaria.demo.service.MascotaService;

@RestController
@RequestMapping("/api/mascotas")
@CrossOrigin(origins = "*")
public class MascotaController {

    private final MascotaService service;

    public MascotaController(MascotaService service) {
        this.service = service;
    }

    @GetMapping
    public List<Mascota> listar() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Mascota obtener(@PathVariable Long id) {
        return service.findById(id);
    }

    @GetMapping("/total")
    public long totalMascotas() {
        return service.count();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CLIENTE', 'RECEPCION')")
    public Mascota crear(@RequestBody Mascota mascota) {
        return service.save(mascota);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CLIENTE', 'RECEPCION')")
    public Mascota editar(@PathVariable Long id, @RequestBody Mascota mascota) {
        mascota.setIdMascota(id);
        return service.save(mascota);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CLIENTE', 'RECEPCION')")
    public void eliminar(@PathVariable Long id) {
        service.deleteById(id);
    }
}
