package com.veterinaria.demo.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.veterinaria.demo.model.Consulta;
import com.veterinaria.demo.model.Tratamiento;
import com.veterinaria.demo.service.ConsultaService;
import com.veterinaria.demo.service.TratamientoService;

@RestController
@RequestMapping("/api/consultas")
@CrossOrigin("*")
public class ConsultaController {

    private final ConsultaService consultaService;
    private final TratamientoService tratamientoService;

    public ConsultaController(ConsultaService consultaService,
                              TratamientoService tratamientoService) {
        this.consultaService = consultaService;
        this.tratamientoService = tratamientoService;
    }

    //  Listar todas las consultas
    @GetMapping
    public List<Consulta> listar() {
        return consultaService.findAll();
    }

    //  Obtener una consulta por ID
    @GetMapping("/{id}")
    public Consulta obtener(@PathVariable Long id) {
        return consultaService.findById(id);
    }

    //  Actualizar SOLO datos clínicos
@PutMapping("/{id}")
public Consulta actualizar(@PathVariable Long id, @RequestBody Consulta datos) {

    Consulta c = consultaService.findById(id);
    if (c == null) return null;

    // ✅ CAMPOS MODIFICABLES
    c.setDiagnostico(datos.getDiagnostico());
    c.setObservaciones(datos.getObservaciones());
    //c.setTratamiento(datos.getTratamiento());  NUEVO

    return consultaService.save(c);
}

    //  Eliminar consulta
    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        consultaService.deleteById(id);
    }
}