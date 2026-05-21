package com.veterinaria.demo.controller;

import java.util.List;
import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.veterinaria.demo.model.Cita;
import com.veterinaria.demo.dto.ReminderResponse;
import com.veterinaria.demo.service.CitaService;
import com.veterinaria.demo.service.CitaReminderService;

@RestController
@RequestMapping("/api/citas")
@CrossOrigin(origins = "*")
public class CitaController {

    private final CitaService service;
    private final CitaReminderService reminderService;

    public CitaController(CitaService service, CitaReminderService reminderService) {
        this.service = service;
        this.reminderService = reminderService;
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
    @PreAuthorize("hasAnyRole('ADMIN', 'CLIENTE')")
    public Cita crear(@RequestBody Cita cita) {
        return service.save(cita);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CLIENTE')")
    public Cita editar(@PathVariable Long id, @RequestBody Cita cita) {
        cita.setIdCita(id);
        return service.save(cita);
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('ADMIN', 'CLIENTE', 'VETERINARIO')")
    public Cita cambiarEstado(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return service.updateEstado(id, body.get("estado"));
    }

    @PostMapping("/recordatorios/proximas")
    @PreAuthorize("hasRole('ADMIN')")
    public ReminderResponse enviarRecordatoriosProximas() {
        return reminderService.enviarRecordatoriosProximasCitas();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CLIENTE')")
    public void eliminar(@PathVariable Long id) {
        service.deleteById(id);
    }
}
