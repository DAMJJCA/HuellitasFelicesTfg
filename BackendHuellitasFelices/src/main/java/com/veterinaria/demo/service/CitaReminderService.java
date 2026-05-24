package com.veterinaria.demo.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import com.veterinaria.demo.dto.ReminderResponse;
import com.veterinaria.demo.model.Cita;
import com.veterinaria.demo.model.Cliente;
import com.veterinaria.demo.repository.CitaRepository;

@Service
public class CitaReminderService {

    private static final List<String> ESTADOS_OMITIDOS = List.of("cancelada", "realizada");

    private final CitaRepository citaRepository;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final boolean enabled;
    private final String from;
    private final NotificationTemplateService templateService;

    public CitaReminderService(
            CitaRepository citaRepository,
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${app.reminders.email.enabled:false}") boolean enabled,
            @Value("${app.reminders.email.from:no-reply@huellitasfelices.local}") String from,
            NotificationTemplateService templateService) {
        this.citaRepository = citaRepository;
        this.mailSenderProvider = mailSenderProvider;
        this.enabled = enabled;
        this.from = from;
        this.templateService = templateService;
    }

    @Scheduled(cron = "${app.reminders.appointments.cron:0 0 9 * * *}", zone = "${app.reminders.zone:Europe/Madrid}")
    public void enviarRecordatoriosProgramados() {
        if (enabled) {
            enviarRecordatoriosProximasCitas();
        }
    }

    public ReminderResponse enviarRecordatoriosProximasCitas() {
        LocalDate manana = LocalDate.now().plusDays(1);
        List<Cita> citas = citaRepository.findByFechaAndEstadoNotIn(manana, ESTADOS_OMITIDOS);

        if (!enabled) {
            return new ReminderResponse(
                    citas.size(),
                    0,
                    citas.size(),
                    "Recordatorios desactivados. Configura SMTP y app.reminders.email.enabled=true para enviar emails.");
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            return new ReminderResponse(
                    citas.size(),
                    0,
                    citas.size(),
                    "No hay servidor de correo configurado.");
        }

        int enviadas = 0;
        int omitidas = 0;

        for (Cita cita : citas) {
            Cliente cliente = cita.getMascota() != null ? cita.getMascota().getCliente() : null;
            if (cliente == null || cliente.getEmail() == null || cliente.getEmail().isBlank()) {
                omitidas++;
                continue;
            }

            mailSender.send(crearMensaje(cita, cliente));
            enviadas++;
        }

        return new ReminderResponse(citas.size(), enviadas, omitidas, "Recordatorios procesados correctamente.");
    }

    public ReminderResponse enviarRecordatorioCita(Long idCita) {
        Cita cita = citaRepository.findById(idCita)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "La cita no existe"));

        if (ESTADOS_OMITIDOS.contains(normalizarEstado(cita.getEstado()))) {
            return new ReminderResponse(1, 0, 1, "La cita esta cancelada o realizada. No se envio recordatorio.");
        }

        Cliente cliente = cita.getMascota() != null ? cita.getMascota().getCliente() : null;
        if (cliente == null || cliente.getEmail() == null || cliente.getEmail().isBlank()) {
            return new ReminderResponse(1, 0, 1, "El cliente no tiene email registrado. Contacta por telefono si esta disponible.");
        }

        if (!enabled) {
            return new ReminderResponse(1, 0, 1, "Recordatorios desactivados. Configura SMTP y app.reminders.email.enabled=true para enviar emails.");
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            return new ReminderResponse(1, 0, 1, "No hay servidor de correo configurado.");
        }

        mailSender.send(crearMensaje(cita, cliente));
        return new ReminderResponse(1, 1, 0, "Recordatorio enviado correctamente.");
    }

    private SimpleMailMessage crearMensaje(Cita cita, Cliente cliente) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(cliente.getEmail());
        message.setSubject("Recordatorio de cita - Huellitas Felices");
        message.setText(templateService.citaReminderEmail(cita, cliente));

        return message;
    }

    private String normalizarEstado(String estado) {
        return estado == null ? "" : estado.trim().toLowerCase().replace('-', '_').replace(' ', '_');
    }
}
