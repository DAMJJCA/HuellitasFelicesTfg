package com.veterinaria.demo.service;

import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import com.veterinaria.demo.model.Consulta;
import com.veterinaria.demo.repository.ConsultaRepository;
import com.veterinaria.demo.repository.MascotaRepository;
import com.veterinaria.demo.security.CurrentUserService;

@Service
public class ConsultaServiceImpl implements ConsultaService {

    private final ConsultaRepository repo;
    private final MascotaRepository mascotaRepository;
    private final CurrentUserService currentUserService;
    private final AuditoriaClinicaService auditoriaClinicaService;

    public ConsultaServiceImpl(
            ConsultaRepository repo,
            MascotaRepository mascotaRepository,
            CurrentUserService currentUserService,
            AuditoriaClinicaService auditoriaClinicaService) {
        this.repo = repo;
        this.mascotaRepository = mascotaRepository;
        this.currentUserService = currentUserService;
        this.auditoriaClinicaService = auditoriaClinicaService;
    }

    @Override
    public List<Consulta> findAll() {
        if (currentUserService.isCliente()) {
            return repo.findByCita_Mascota_Cliente_IdCliente(currentUserService.getAuthenticatedClienteIdOrThrow());
        }
        if (currentUserService.isVeterinario()) {
            return repo.findByCita_Veterinario_IdVeterinario(currentUserService.getAuthenticatedVeterinarioIdOrThrow());
        }
        return repo.findAll();
    }

    @Override
    public Consulta findById(Long id) {
        if (currentUserService.isCliente()) {
            return repo.findByIdConsultaAndCita_Mascota_Cliente_IdCliente(id, currentUserService.getAuthenticatedClienteIdOrThrow())
                    .orElseThrow(() -> new AccessDeniedException("No tienes acceso a esta consulta"));
        }
        if (currentUserService.isVeterinario()) {
            return repo.findByIdConsultaAndCita_Veterinario_IdVeterinario(id, currentUserService.getAuthenticatedVeterinarioIdOrThrow())
                    .orElseThrow(() -> new AccessDeniedException("No tienes acceso a esta consulta"));
        }
        return repo.findById(id).orElse(null);
    }

    @Override
    public List<Consulta> findByMascota(Long idMascota) {
        if (currentUserService.isCliente()) {
            Long idCliente = currentUserService.getAuthenticatedClienteIdOrThrow();
            if (!mascotaRepository.existsByIdMascotaAndCliente_IdCliente(idMascota, idCliente)) {
                throw new AccessDeniedException("No tienes acceso al historial medico de esta mascota");
            }
            return repo.findByCita_Mascota_IdMascotaAndCita_Mascota_Cliente_IdCliente(idMascota, idCliente);
        }
        if (currentUserService.isVeterinario()) {
            return repo.findByCita_Mascota_IdMascotaAndCita_Veterinario_IdVeterinario(
                    idMascota,
                    currentUserService.getAuthenticatedVeterinarioIdOrThrow());
        }
        return repo.findByCita_Mascota_IdMascota(idMascota);
    }

    @Override
    public Consulta save(Consulta consulta) {
        if (currentUserService.isCliente() || currentUserService.isRecepcion() || currentUserService.isAuxiliar()) {
            throw new AccessDeniedException("Tu rol no puede modificar consultas clinicas");
        }
        validarConsulta(consulta);
        Consulta saved = repo.save(consulta);
        auditoriaClinicaService.registrar("consulta", saved.getIdConsulta(), "editar", "Consulta actualizada");
        return saved;
    }

    @Override
    public void deleteById(Long id) {
        if (currentUserService.isCliente() || currentUserService.isRecepcion() || currentUserService.isAuxiliar()) {
            throw new AccessDeniedException("Tu rol no puede eliminar consultas clinicas");
        }
        repo.deleteById(id);
        auditoriaClinicaService.registrar("consulta", id, "eliminar", "Consulta eliminada");
    }

    private void validarConsulta(Consulta consulta) {
        if (consulta.getDiagnostico() != null && consulta.getDiagnostico().length() > 1000) {
            throw new IllegalArgumentException("El diagnostico no puede superar 1000 caracteres");
        }
        if (consulta.getObservaciones() != null && consulta.getObservaciones().length() > 1500) {
            throw new IllegalArgumentException("Las observaciones no pueden superar 1500 caracteres");
        }
    }
}
