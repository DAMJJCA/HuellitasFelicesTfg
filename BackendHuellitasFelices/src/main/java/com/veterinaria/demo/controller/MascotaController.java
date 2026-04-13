package com.veterinaria.demo.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.veterinaria.demo.model.Mascota;
import com.veterinaria.demo.service.MascotaService;

@RestController
@RequestMapping("/api/mascotas")
@CrossOrigin(origins = "*")
public class MascotaController {

    private final MascotaService service;

    public MascotaController(MascotaService service){
        this.service = service;
    }

    @GetMapping
    public List<Mascota> listar(){
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Mascota obtener(@PathVariable Long id){
        return service.findById(id);
    }

    @GetMapping("/total")
    public long totalMascotas() {
        return service.count();
    }

    @PostMapping
    public Mascota crear(@RequestBody Mascota mascota){
        return service.save(mascota);
    }

    @PutMapping("/{id}")
    public Mascota editar(@PathVariable Long id, @RequestBody Mascota mascota){
        mascota.setIdMascota(id);
        return service.save(mascota);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id){
        service.deleteById(id);
    }
}