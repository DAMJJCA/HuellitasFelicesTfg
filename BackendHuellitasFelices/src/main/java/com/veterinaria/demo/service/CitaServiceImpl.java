package com.veterinaria.demo.service;

import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.veterinaria.demo.model.Cita;
import com.veterinaria.demo.model.Consulta;
import com.veterinaria.demo.repository.CitaRepository;
import com.veterinaria.demo.repository.ConsultaRepository;
import com.veterinaria.demo.repository.MascotaRepository;
import com.veterinaria.demo.security.CurrentUserService;

@Service
public class CitaServiceImpl implements CitaService {

    private final CitaRepository citaRepo;
    private final ConsultaRepository consultaRepo;
    private final MascotaRepository mascotaRepository;
    private final CurrentUserService currentUserService;

    public CitaServiceImpl(
            CitaRepository citaRepo,
            ConsultaRepository consultaRepo,
            MascotaRepository mascotaRepository,
            CurrentUserService currentUserService) {
        this.citaRepo = citaRepo;
        this.consultaRepo = consultaRepo;
        this.mascotaRepository = mascotaRepository;
        this.currentUserService = currentUserService;
    }

    @Override
    public List<Cita> findAll() {
        if (currentUserService.isCliente()) {
            return citaRepo.findByMascota_Cliente_IdCliente(currentUserService.getAuthenticatedClienteIdOrThrow());
        }
        if (currentUserService.isVeterinario()) {
            return citaRepo.findByVeterinario_IdVeterinario(currentUserService.getAuthenticatedVeterinarioIdOrThrow());
        }
        return citaRepo.findAll();
    }

    @Override
    public Cita findById(Long id) {
        if (currentUserService.isCliente()) {
            return citaRepo.findByIdCitaAndMascota_Cliente_IdCliente(id, currentUserService.getAuthenticatedClienteIdOrThrow())
                    .orElseThrow(() -> new AccessDeniedException("No tienes acceso a esta cita"));
        }
        if (currentUserService.isVeterinario()) {
            return citaRepo.findByIdCitaAndVeterinario_IdVeterinario(id, currentUserService.getAuthenticatedVeterinarioIdOrThrow())
                    .orElseThrow(() -> new AccessDeniedException("No tienes acceso a esta cita"));
        }
        return citaRepo.findById(id).orElse(null);
    }

    @Override
    @Transactional
    public Cita save(Cita cita) {
        if (currentUserService.isVeterinario()) {
            throw new AccessDeniedException("Los veterinarios no pueden crear ni editar citas");
        }

        if (cita.getMascota() == null || cita.getMascota().getIdMascota() == null) {
            throw new IllegalArgumentException("Debes indicar la mascota de la cita");
        }

        if (currentUserService.isCliente()) {
            Long idCliente = currentUserService.getAuthenticatedClienteIdOrThrow();
            Long idMascota = cita.getMascota().getIdMascota();

            if (!mascotaRepository.existsByIdMascotaAndCliente_IdCliente(idMascota, idCliente)) {
                throw new AccessDeniedException("No puedes crear o editar citas para mascotas de otro cliente");
            }

            if (cita.getIdCita() != null
                    && citaRepo.findByIdCitaAndMascota_Cliente_IdCliente(cita.getIdCita(), idCliente).isEmpty()) {
                throw new AccessDeniedException("No tienes acceso para editar esta cita");
            }
        }

        Cita saved = citaRepo.save(cita);

        if (saved.getConsulta() == null) {
            Consulta consulta = new Consulta();
            consulta.setFecha(saved.getFecha());
            consulta.setHora(saved.getHora());
            consulta.setDiagnostico("");
            consulta.setObservaciones("");
            consulta.setCita(saved);

            consultaRepo.save(consulta);
            saved.setConsulta(consulta);
        }

        return saved;
    }

    @Override
    public void deleteById(Long id) {
        if (currentUserService.isVeterinario()) {
            throw new AccessDeniedException("Los veterinarios no pueden eliminar citas");
        }

        if (currentUserService.isCliente()
                && citaRepo.findByIdCitaAndMascota_Cliente_IdCliente(id, currentUserService.getAuthenticatedClienteIdOrThrow())
                        .isEmpty()) {
            throw new AccessDeniedException("No tienes acceso para eliminar esta cita");
        }
        citaRepo.deleteById(id);
    }
}
