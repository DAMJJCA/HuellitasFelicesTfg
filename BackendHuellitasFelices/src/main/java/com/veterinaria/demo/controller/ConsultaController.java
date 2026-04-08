package com.veterinaria.demo.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.veterinaria.demo.model.Consulta;
import com.veterinaria.demo.service.ConsultaService;

@RestController
@RequestMapping("/api/consultas")
@CrossOrigin("*")
public class ConsultaController {

    private final ConsultaService consultaService;

    public ConsultaController(ConsultaService consultaService) {
        this.consultaService = consultaService;
    }

    // Listar todas las consultas
    @GetMapping
    public List<Consulta> listar() {
        return consultaService.findAll();
    }

    // Obtener una consulta por ID
    @GetMapping("/{id}")
    public Consulta obtener(@PathVariable Long id) {
        return consultaService.findById(id);
    }

    // Actualizar SOLO datos clínicos
    @PutMapping("/{id}")
    public Consulta actualizar(@PathVariable Long id, @RequestBody Consulta datos) {

        Consulta c = consultaService.findById(id);
        if (c == null) return null;

        c.setDiagnostico(datos.getDiagnostico());
        c.setObservaciones(datos.getObservaciones());

        return consultaService.save(c);
    }

    // Eliminar consulta
    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        consultaService.deleteById(id);
    }
}