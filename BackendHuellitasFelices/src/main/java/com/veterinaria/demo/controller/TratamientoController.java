package com.veterinaria.demo.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.veterinaria.demo.model.Tratamiento;
import com.veterinaria.demo.service.TratamientoService;

@RestController
@RequestMapping("/api/tratamientos")
@CrossOrigin("*")
public class TratamientoController {

    private final TratamientoService service;

    public TratamientoController(TratamientoService service) {
        this.service = service;
    }

    // Listar todos
    @GetMapping
    public List<Tratamiento> listar() {
        return service.findAll();
    }

    // Listar por consulta
    @GetMapping("/consulta/{idConsulta}")
    public List<Tratamiento> listarPorConsulta(@PathVariable Long idConsulta) {
        return service.findByConsulta(idConsulta);
    }
    

    @GetMapping("/mascota/{idMascota}")
	public List<Tratamiento> listarPorMascota(@PathVariable Long idMascota) {
    	return service.findByMascota(idMascota);
	}


    // Obtener uno
    @GetMapping("/{id}")
    public Tratamiento obtener(@PathVariable Long id) {
        return service.findById(id);
    }

    // Crear
    @PostMapping
    public Tratamiento crear(@RequestBody Tratamiento tratamiento) {
        return service.save(tratamiento);
    }

    // Editar
    @PutMapping("/{id}")
    public Tratamiento editar(@PathVariable Long id, @RequestBody Tratamiento datos) {
        datos.setIdTratamiento(id);
        return service.save(datos);
    }

    // Eliminar
    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        service.deleteById(id);
    }
}