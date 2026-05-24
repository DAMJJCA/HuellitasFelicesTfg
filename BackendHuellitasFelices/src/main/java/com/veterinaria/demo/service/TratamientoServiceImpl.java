package com.veterinaria.demo.service;

import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import com.veterinaria.demo.model.Tratamiento;
import com.veterinaria.demo.repository.MascotaRepository;
import com.veterinaria.demo.repository.TratamientoRepository;
import com.veterinaria.demo.security.CurrentUserService;

@Service
public class TratamientoServiceImpl implements TratamientoService {

    private final TratamientoRepository repo;
    private final MascotaRepository mascotaRepository;
    private final CurrentUserService currentUserService;
    private final AuditoriaClinicaService auditoriaClinicaService;

    public TratamientoServiceImpl(
            TratamientoRepository repo,
            MascotaRepository mascotaRepository,
            CurrentUserService currentUserService,
            AuditoriaClinicaService auditoriaClinicaService) {
        this.repo = repo;
        this.mascotaRepository = mascotaRepository;
        this.currentUserService = currentUserService;
        this.auditoriaClinicaService = auditoriaClinicaService;
    }

    @Override
    public List<Tratamiento> findAll() {
        if (currentUserService.isCliente()) {
            return repo.findByConsulta_Cita_Mascota_Cliente_IdCliente(currentUserService.getAuthenticatedClienteIdOrThrow());
        }
        if (currentUserService.isVeterinario()) {
            return repo.findByConsulta_Cita_Veterinario_IdVeterinario(currentUserService.getAuthenticatedVeterinarioIdOrThrow());
        }
        return repo.findAll();
    }

    @Override
    public List<Tratamiento> findByConsulta(Long idConsulta) {
        if (currentUserService.isCliente()) {
            return repo.findByConsulta_IdConsultaAndConsulta_Cita_Mascota_Cliente_IdCliente(
                    idConsulta,
                    currentUserService.getAuthenticatedClienteIdOrThrow());
        }
        if (currentUserService.isVeterinario()) {
            return repo.findByConsulta_IdConsultaAndConsulta_Cita_Veterinario_IdVeterinario(
                    idConsulta,
                    currentUserService.getAuthenticatedVeterinarioIdOrThrow());
        }
        return repo.findByConsulta_IdConsulta(idConsulta);
    }

    @Override
    public List<Tratamiento> findByMascota(Long idMascota) {
        if (currentUserService.isCliente()) {
            Long idCliente = currentUserService.getAuthenticatedClienteIdOrThrow();
            if (!mascotaRepository.existsByIdMascotaAndCliente_IdCliente(idMascota, idCliente)) {
                throw new AccessDeniedException("No tienes acceso al historial medico de esta mascota");
            }
            return repo.findByConsulta_Cita_Mascota_IdMascotaAndConsulta_Cita_Mascota_Cliente_IdCliente(idMascota, idCliente);
        }
        if (currentUserService.isVeterinario()) {
            return repo.findByConsulta_Cita_Mascota_IdMascotaAndConsulta_Cita_Veterinario_IdVeterinario(
                    idMascota,
                    currentUserService.getAuthenticatedVeterinarioIdOrThrow());
        }
        return repo.findByConsulta_Cita_Mascota_IdMascota(idMascota);
    }

    @Override
    public Tratamiento findById(Long id) {
        Tratamiento tratamiento = repo.findById(id).orElse(null);
        if (tratamiento == null) {
            return null;
        }

        if (currentUserService.isCliente()) {
            Long idCliente = currentUserService.getAuthenticatedClienteIdOrThrow();
            Long idClienteTratamiento = tratamiento.getConsulta()
                    .getCita()
                    .getMascota()
                    .getCliente()
                    .getIdCliente();
            if (!idCliente.equals(idClienteTratamiento)) {
                throw new AccessDeniedException("No tienes acceso a este tratamiento");
            }
        }
        if (currentUserService.isVeterinario()) {
            Long idVeterinario = currentUserService.getAuthenticatedVeterinarioIdOrThrow();
            Long idVeterinarioTratamiento = tratamiento.getConsulta()
                    .getCita()
                    .getVeterinario()
                    .getIdVeterinario();
            if (!idVeterinario.equals(idVeterinarioTratamiento)) {
                throw new AccessDeniedException("No tienes acceso a este tratamiento");
            }
        }

        return tratamiento;
    }

    @Override
    public Tratamiento save(Tratamiento tratamiento) {
        if (currentUserService.isCliente() || currentUserService.isRecepcion() || currentUserService.isAuxiliar()) {
            throw new AccessDeniedException("Tu rol no puede modificar tratamientos");
        }
        validarTratamiento(tratamiento);
        Tratamiento saved = repo.save(tratamiento);
        auditoriaClinicaService.registrar("tratamiento", saved.getIdTratamiento(), tratamiento.getIdTratamiento() == null ? "crear" : "editar", "Tratamiento " + saved.getNombre());
        return saved;
    }

    @Override
    public void deleteById(Long id) {
        if (currentUserService.isCliente() || currentUserService.isRecepcion() || currentUserService.isAuxiliar()) {
            throw new AccessDeniedException("Tu rol no puede eliminar tratamientos");
        }
        repo.deleteById(id);
        auditoriaClinicaService.registrar("tratamiento", id, "eliminar", "Tratamiento eliminado");
    }

    private void validarTratamiento(Tratamiento tratamiento) {
        if (tratamiento.getNombre() == null || tratamiento.getNombre().isBlank()) {
            throw new IllegalArgumentException("Debes indicar el nombre del tratamiento");
        }
        if (tratamiento.getMedicamento() == null || tratamiento.getMedicamento().isBlank()) {
            throw new IllegalArgumentException("Debes indicar el medicamento del tratamiento");
        }
        if (tratamiento.getDosis() == null || tratamiento.getDosis().isBlank()) {
            throw new IllegalArgumentException("Debes indicar la dosis del tratamiento");
        }
        if (tratamiento.getDuracion() == null || tratamiento.getDuracion().isBlank()) {
            throw new IllegalArgumentException("Debes indicar la duracion del tratamiento");
        }
    }
}
