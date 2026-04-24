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

    public TratamientoServiceImpl(
            TratamientoRepository repo,
            MascotaRepository mascotaRepository,
            CurrentUserService currentUserService) {
        this.repo = repo;
        this.mascotaRepository = mascotaRepository;
        this.currentUserService = currentUserService;
    }

    @Override
    public List<Tratamiento> findAll() {
        if (currentUserService.isCliente()) {
            return repo.findByConsulta_Cita_Mascota_Cliente_IdCliente(currentUserService.getAuthenticatedClienteIdOrThrow());
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

        return tratamiento;
    }

    @Override
    public Tratamiento save(Tratamiento tratamiento) {
        if (currentUserService.isCliente()) {
            throw new AccessDeniedException("Los clientes no pueden modificar tratamientos");
        }
        return repo.save(tratamiento);
    }

    @Override
    public void deleteById(Long id) {
        if (currentUserService.isCliente()) {
            throw new AccessDeniedException("Los clientes no pueden eliminar tratamientos");
        }
        repo.deleteById(id);
    }
}
