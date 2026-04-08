package com.veterinaria.demo.controller;

import java.util.List;
import org.springframework.web.bind.annotation.*;
import com.veterinaria.demo.model.Cita;
import com.veterinaria.demo.service.CitaService;

@RestController
@RequestMapping("/api/citas")
@CrossOrigin(origins = "*")
public class CitaController {

    private final CitaService service;

    public CitaController(CitaService service) {
        this.service = service;
    }

    @GetMapping
    public List<Cita> listar() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Cita obtener(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public Cita crear(@RequestBody Cita cita) {
        return service.save(cita); // CREA CONSULTA AUTOMÁTICA
    }

    @PutMapping("/{id}")
    public Cita editar(@PathVariable Long id, @RequestBody Cita cita) {
        cita.setIdCita(id);
        return service.save(cita);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        service.deleteById(id);
    }
}