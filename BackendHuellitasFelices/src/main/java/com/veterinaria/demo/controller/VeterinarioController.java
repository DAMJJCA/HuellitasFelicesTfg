package com.veterinaria.demo.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.veterinaria.demo.model.Veterinario;
import com.veterinaria.demo.service.VeterinarioService;

@RestController
@RequestMapping("/api/veterinarios")
@CrossOrigin(origins = "*")
public class VeterinarioController {

    private final VeterinarioService service;

    public VeterinarioController(VeterinarioService service) {
        this.service = service;
    }

    @GetMapping
    public List<Veterinario> listar() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Veterinario obtener(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public Veterinario crear(@RequestBody Veterinario veterinario) {
        return service.save(veterinario);
    }

    @PutMapping("/{id}")
    public Veterinario editar(@PathVariable Long id, @RequestBody Veterinario veterinario) {
        veterinario.setIdVeterinario(id);
        return service.save(veterinario);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        service.deleteById(id);
    }
}