package com.veterinaria.demo.service;

import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.veterinaria.demo.model.Cliente;
import com.veterinaria.demo.model.Mascota;
import com.veterinaria.demo.repository.ClienteRepository;
import com.veterinaria.demo.repository.MascotaRepository;
import com.veterinaria.demo.security.CurrentUserService;

@Service
public class MascotaServiceImpl implements MascotaService {

    private final MascotaRepository repository;
    private final ClienteRepository clienteRepository;
    private final CurrentUserService currentUserService;

    public MascotaServiceImpl(
            MascotaRepository repository,
            ClienteRepository clienteRepository,
            CurrentUserService currentUserService) {
        this.repository = repository;
        this.clienteRepository = clienteRepository;
        this.currentUserService = currentUserService;
    }

    @Override
    public List<Mascota> findAll() {
        if (currentUserService.isCliente()) {
            return repository.findByCliente_IdCliente(currentUserService.getAuthenticatedClienteIdOrThrow());
        }
        return repository.findAll();
    }

    @Override
    public Mascota findById(Long id) {
        if (currentUserService.isCliente()) {
            return repository.findByIdMascotaAndCliente_IdCliente(id, currentUserService.getAuthenticatedClienteIdOrThrow())
                    .orElseThrow(() -> new AccessDeniedException("No tienes acceso a esta mascota"));
        }
        return repository.findById(id).orElse(null);
    }

    @Override
    public long count() {
        if (currentUserService.isCliente()) {
            return repository.countByCliente_IdCliente(currentUserService.getAuthenticatedClienteIdOrThrow());
        }
        return repository.count();
    }

    @Override
    @Transactional
    public Mascota save(Mascota mascota) {
        if (currentUserService.isVeterinario()) {
            throw new AccessDeniedException("Los veterinarios no pueden crear ni editar mascotas");
        }

        Long idClienteDestino;

        if (currentUserService.isCliente()) {
            idClienteDestino = currentUserService.getAuthenticatedClienteIdOrThrow();
            if (mascota.getIdMascota() != null
                    && !repository.existsByIdMascotaAndCliente_IdCliente(mascota.getIdMascota(), idClienteDestino)) {
                throw new AccessDeniedException("No tienes acceso para editar esta mascota");
            }
        } else {
            if (mascota.getCliente() == null || mascota.getCliente().getIdCliente() == null) {
                throw new IllegalArgumentException("Debes indicar el idCliente");
            }
            idClienteDestino = mascota.getCliente().getIdCliente();
        }

        Cliente cliente = clienteRepository.findById(idClienteDestino)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        mascota.setCliente(cliente);
        return repository.save(mascota);
    }

    @Override
    public void deleteById(Long id) {
        if (currentUserService.isVeterinario()) {
            throw new AccessDeniedException("Los veterinarios no pueden eliminar mascotas");
        }

        if (currentUserService.isCliente()
                && !repository.existsByIdMascotaAndCliente_IdCliente(id, currentUserService.getAuthenticatedClienteIdOrThrow())) {
            throw new AccessDeniedException("No tienes acceso para eliminar esta mascota");
        }
        repository.deleteById(id);
    }
}
