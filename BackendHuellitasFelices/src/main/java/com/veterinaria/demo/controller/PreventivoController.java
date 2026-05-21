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

import com.veterinaria.demo.dto.PreventivoRequest;
import com.veterinaria.demo.dto.PreventivoResponse;
import com.veterinaria.demo.dto.ReminderResponse;
import com.veterinaria.demo.service.PreventivoReminderService;
import com.veterinaria.demo.service.PreventivoService;

@RestController
@RequestMapping("/api/preventivos")
@CrossOrigin(origins = "*")
public class PreventivoController {

    private final PreventivoService service;
    private final PreventivoReminderService reminderService;

    public PreventivoController(PreventivoService service, PreventivoReminderService reminderService) {
        this.service = service;
        this.reminderService = reminderService;
    }

    @GetMapping
    public List<PreventivoResponse> listar() {
        return service.findAll();
    }

    @GetMapping("/proximos")
    public List<PreventivoResponse> listarProximos() {
        return service.findProximos();
    }

    @GetMapping("/{id}")
    public PreventivoResponse obtener(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'VETERINARIO')")
    public PreventivoResponse crear(@RequestBody PreventivoRequest request) {
        return service.save(request);
    }

    @PostMapping("/recordatorios/proximas-dosis")
    @PreAuthorize("hasRole('ADMIN')")
    public ReminderResponse enviarRecordatoriosProximasDosis() {
        return reminderService.enviarRecordatoriosProximasDosis();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'VETERINARIO')")
    public PreventivoResponse editar(@PathVariable Long id, @RequestBody PreventivoRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'VETERINARIO')")
    public void eliminar(@PathVariable Long id) {
        service.deleteById(id);
    }
}
