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

    public ConsultaServiceImpl(
            ConsultaRepository repo,
            MascotaRepository mascotaRepository,
            CurrentUserService currentUserService) {
        this.repo = repo;
        this.mascotaRepository = mascotaRepository;
        this.currentUserService = currentUserService;
    }

    @Override
    public List<Consulta> findAll() {
        if (currentUserService.isCliente()) {
            return repo.findByCita_Mascota_Cliente_IdCliente(currentUserService.getAuthenticatedClienteIdOrThrow());
        }
        return repo.findAll();
    }

    @Override
    public Consulta findById(Long id) {
        if (currentUserService.isCliente()) {
            return repo.findByIdConsultaAndCita_Mascota_Cliente_IdCliente(id, currentUserService.getAuthenticatedClienteIdOrThrow())
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
        return repo.findByCita_Mascota_IdMascota(idMascota);
    }

    @Override
    public Consulta save(Consulta consulta) {
        if (currentUserService.isCliente()) {
            throw new AccessDeniedException("Los clientes no pueden modificar consultas");
        }
        return repo.save(consulta);
    }

    @Override
    public void deleteById(Long id) {
        if (currentUserService.isCliente()) {
            throw new AccessDeniedException("Los clientes no pueden eliminar consultas");
        }
        repo.deleteById(id);
    }
}
