package com.veterinaria.demo.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.veterinaria.demo.dto.ReminderResponse;
import com.veterinaria.demo.model.Cita;
import com.veterinaria.demo.model.Cliente;
import com.veterinaria.demo.repository.CitaRepository;

@Service
public class CitaReminderService {

    private static final DateTimeFormatter FECHA_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final List<String> ESTADOS_OMITIDOS = List.of("cancelada", "realizada");

    private final CitaRepository citaRepository;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final boolean enabled;
    private final String from;

    public CitaReminderService(
            CitaRepository citaRepository,
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${app.reminders.email.enabled:false}") boolean enabled,
            @Value("${app.reminders.email.from:no-reply@huellitasfelices.local}") String from) {
        this.citaRepository = citaRepository;
        this.mailSenderProvider = mailSenderProvider;
        this.enabled = enabled;
        this.from = from;
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

    private SimpleMailMessage crearMensaje(Cita cita, Cliente cliente) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(cliente.getEmail());
        message.setSubject("Recordatorio de cita - Huellitas Felices");
        message.setText("""
                Hola %s,

                Te recordamos que manana tienes una cita en Huellitas Felices.

                Mascota: %s
                Fecha: %s
                Hora: %s
                Motivo: %s
                Veterinario: %s

                Si necesitas modificar o cancelar la cita, contacta con la clinica.

                Huellitas Felices
                """.formatted(
                cliente.getNombre(),
                cita.getMascota() != null ? cita.getMascota().getNombre() : "Sin mascota asignada",
                cita.getFecha() != null ? cita.getFecha().format(FECHA_FORMATTER) : "Sin fecha",
                cita.getHora() != null ? cita.getHora() : "Sin hora",
                cita.getMotivo() != null ? cita.getMotivo() : "Sin motivo",
                cita.getVeterinario() != null ? cita.getVeterinario().getNombre() : "Sin veterinario asignado"));

        return message;
    }
}
