package com.veterinaria.demo.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.veterinaria.demo.model.Cita;
import com.veterinaria.demo.model.Consulta;
import com.veterinaria.demo.repository.CitaRepository;
import com.veterinaria.demo.repository.ConsultaRepository;
import com.veterinaria.demo.repository.MascotaRepository;
import com.veterinaria.demo.security.CurrentUserService;

@Service
public class CitaServiceImpl implements CitaService {

    private static final Set<String> ESTADOS_PERMITIDOS = Set.of(
            "programada",
            "confirmada",
            "en_consulta",
            "realizada",
            "completada",
            "cancelada");

    private static final List<String> ESTADOS_QUE_OCUPAN_HORARIO = List.of(
            "programada",
            "confirmada",
            "en_consulta");

    private final CitaRepository citaRepo;
    private final ConsultaRepository consultaRepo;
    private final MascotaRepository mascotaRepository;
    private final CurrentUserService currentUserService;
    private final DisponibilidadVeterinarioService disponibilidadVeterinarioService;
    private final CitaDuracionService citaDuracionService;

    public CitaServiceImpl(
            CitaRepository citaRepo,
            ConsultaRepository consultaRepo,
            MascotaRepository mascotaRepository,
            CurrentUserService currentUserService,
            DisponibilidadVeterinarioService disponibilidadVeterinarioService,
            CitaDuracionService citaDuracionService) {
        this.citaRepo = citaRepo;
        this.consultaRepo = consultaRepo;
        this.mascotaRepository = mascotaRepository;
        this.currentUserService = currentUserService;
        this.disponibilidadVeterinarioService = disponibilidadVeterinarioService;
        this.citaDuracionService = citaDuracionService;
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

        cita.setEstado(normalizarEstado(cita.getEstado()));
        validarFechaCita(cita);
        validarDisponibilidadHorario(cita);
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
    @Transactional
    public Cita updateEstado(Long id, String estado) {
        Cita cita = findById(id);
        if (cita == null) {
            throw new IllegalArgumentException("La cita no existe");
        }

        if (currentUserService.isCliente()
                && ("en_consulta".equals(normalizarEstado(estado)) || "realizada".equals(normalizarEstado(estado)))) {
            throw new AccessDeniedException("Los clientes no pueden marcar citas como en consulta o realizadas");
        }

        cita.setEstado(normalizarEstado(estado));
        validarFechaCita(cita);
        validarDisponibilidadHorario(cita);
        return citaRepo.save(cita);
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

    private String normalizarEstado(String estado) {
        if (estado == null || estado.isBlank()) {
            return "programada";
        }

        String estadoNormalizado = estado.trim().toLowerCase(Locale.ROOT).replace('-', '_').replace(' ', '_');
        if (!ESTADOS_PERMITIDOS.contains(estadoNormalizado)) {
            throw new IllegalArgumentException("Estado de cita no valido: " + estado);
        }

        return estadoNormalizado;
    }

    private void validarDisponibilidadHorario(Cita cita) {
        if (!ESTADOS_QUE_OCUPAN_HORARIO.contains(cita.getEstado())) {
            return;
        }

        if (cita.getVeterinario() == null || cita.getVeterinario().getIdVeterinario() == null) {
            throw new IllegalArgumentException("Debes indicar el veterinario de la cita");
        }

        if (cita.getFecha() == null || cita.getHora() == null || cita.getHora().isBlank()) {
            throw new IllegalArgumentException("Debes indicar fecha y hora de la cita");
        }

        boolean horarioOcupado = citaRepo.findByVeterinario_IdVeterinarioAndFechaAndEstadoIn(
                cita.getVeterinario().getIdVeterinario(),
                cita.getFecha(),
                ESTADOS_QUE_OCUPAN_HORARIO).stream()
                .anyMatch(existente -> haySolape(cita, existente));

        if (horarioOcupado) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "El veterinario ya tiene una cita activa en esa fecha y hora");
        }

        boolean veterinarioDisponible = disponibilidadVeterinarioService.estaDisponible(
                cita.getVeterinario().getIdVeterinario(),
                cita.getFecha(),
                cita.getHora());

        if (!veterinarioDisponible) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "El veterinario no esta disponible en esa fecha y hora");
        }
    }

    private void validarFechaCita(Cita cita) {
        if (!ESTADOS_QUE_OCUPAN_HORARIO.contains(cita.getEstado())) {
            return;
        }

        if (cita.getFecha() == null || cita.getHora() == null || cita.getHora().isBlank()) {
            throw new IllegalArgumentException("Debes indicar fecha y hora de la cita");
        }

        LocalDate hoy = LocalDate.now();
        if (cita.getFecha().isBefore(hoy)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se puede programar una cita activa en una fecha pasada");
        }

        if (cita.getFecha().isEqual(hoy)) {
            try {
                LocalTime horaCita = LocalTime.parse(cita.getHora());
                if (horaCita.isBefore(LocalTime.now())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se puede programar una cita activa en una hora pasada");
                }
            } catch (ResponseStatusException ex) {
                throw ex;
            } catch (Exception ex) {
                throw new IllegalArgumentException("La hora de la cita no tiene un formato valido");
            }
        }
    }

    private boolean haySolape(Cita cita, Cita existente) {
        if (existente.getIdCita() != null && existente.getIdCita().equals(cita.getIdCita())) {
            return false;
        }

        try {
            LocalTime inicioNueva = LocalTime.parse(cita.getHora());
            LocalTime finNueva = inicioNueva.plusMinutes(citaDuracionService.duracionMinutos(null, cita.getDuracionMinutos()));
            LocalTime inicioExistente = LocalTime.parse(existente.getHora());
            LocalTime finExistente = inicioExistente.plusMinutes(citaDuracionService.duracionMinutos(existente.getIdCita(), 30));
            return inicioNueva.isBefore(finExistente) && inicioExistente.isBefore(finNueva);
        } catch (Exception ex) {
            throw new IllegalArgumentException("La hora de la cita no tiene un formato valido");
        }
    }
}
