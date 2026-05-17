package com.veterinaria.demo.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.veterinaria.demo.dto.ConsultaResponse;
import com.veterinaria.demo.model.Consulta;
import com.veterinaria.demo.service.ConsultaService;
import com.veterinaria.demo.service.TratamientoService;

@RestController
@RequestMapping("/api/consultas")
@CrossOrigin("*")
public class ConsultaController {

    private final ConsultaService consultaService;
    private final TratamientoService tratamientoService;

    public ConsultaController(ConsultaService consultaService, TratamientoService tratamientoService) {
        this.consultaService = consultaService;
        this.tratamientoService = tratamientoService;
    }

    // Listar todas las consultas
    @GetMapping
    public List<ConsultaResponse> listar() {
        return consultaService.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    // Obtener una consulta por ID
    @GetMapping("/{id}")
    public ConsultaResponse obtener(@PathVariable Long id) {
        return toResponse(consultaService.findById(id));
    }
    

    @GetMapping("/mascota/{idMascota}")
	public List<ConsultaResponse> listarPorMascota(@PathVariable Long idMascota) {
    	return consultaService.findByMascota(idMascota).stream()
                .map(this::toResponse)
                .toList();
	}


    // Actualizar SOLO datos clínicos
    @PutMapping("/{id}")
    public ConsultaResponse actualizar(@PathVariable Long id, @RequestBody Consulta datos) {

        Consulta c = consultaService.findById(id);
        if (c == null) return null;

        c.setDiagnostico(datos.getDiagnostico());
        c.setObservaciones(datos.getObservaciones());

        return toResponse(consultaService.save(c));
    }

    // Eliminar consulta
    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        consultaService.deleteById(id);
    }

    private ConsultaResponse toResponse(Consulta consulta) {
        return ConsultaResponse.from(
                consulta,
                tratamientoService.findByConsulta(consulta.getIdConsulta()));
    }
} 
