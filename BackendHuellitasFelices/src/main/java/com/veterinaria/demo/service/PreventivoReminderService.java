package com.veterinaria.demo.service;

import java.sql.Date;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.veterinaria.demo.dto.ReminderResponse;

@Service
public class PreventivoReminderService {

    private static final DateTimeFormatter FECHA_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final JdbcTemplate jdbcTemplate;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final boolean enabled;
    private final String from;
    private final int daysAhead;

    public PreventivoReminderService(
            JdbcTemplate jdbcTemplate,
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${app.reminders.email.enabled:false}") boolean enabled,
            @Value("${app.reminders.email.from:no-reply@huellitasfelices.local}") String from,
            @Value("${app.reminders.preventives.days-ahead:7}") int daysAhead) {
        this.jdbcTemplate = jdbcTemplate;
        this.mailSenderProvider = mailSenderProvider;
        this.enabled = enabled;
        this.from = from;
        this.daysAhead = daysAhead;
    }

    @Scheduled(cron = "${app.reminders.preventives.cron:0 30 9 * * *}", zone = "${app.reminders.zone:Europe/Madrid}")
    public void enviarRecordatoriosProgramados() {
        if (enabled) {
            enviarRecordatoriosProximasDosis();
        }
    }

    public ReminderResponse enviarRecordatoriosProximasDosis() {
        List<PreventivoReminder> preventivos = buscarProximasDosis();

        if (!enabled) {
            return new ReminderResponse(
                    preventivos.size(),
                    0,
                    preventivos.size(),
                    "Recordatorios desactivados. Configura SMTP y app.reminders.email.enabled=true para enviar emails.");
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            return new ReminderResponse(preventivos.size(), 0, preventivos.size(), "No hay servidor de correo configurado.");
        }

        int enviadas = 0;
        int omitidas = 0;

        for (PreventivoReminder preventivo : preventivos) {
            if (preventivo.emailCliente() == null || preventivo.emailCliente().isBlank()) {
                omitidas++;
                continue;
            }

            mailSender.send(crearMensaje(preventivo));
            enviadas++;
        }

        return new ReminderResponse(preventivos.size(), enviadas, omitidas, "Recordatorios preventivos procesados correctamente.");
    }

    private List<PreventivoReminder> buscarProximasDosis() {
        LocalDate hoy = LocalDate.now();
        LocalDate hasta = hoy.plusDays(daysAhead);

        return jdbcTemplate.query("""
                select p.tipo, p.nombre, p.proxima_dosis, p.observaciones,
                       m.nombre as nombre_mascota,
                       c.nombre as nombre_cliente,
                       c.email as email_cliente
                from vacunas_desparasitaciones p
                join mascotas m on m.id_mascota = p.id_mascota
                join clientes c on c.id_cliente = m.id_cliente
                where p.proxima_dosis is not null
                  and p.proxima_dosis between ? and ?
                order by p.proxima_dosis
                """,
                (rs, rowNum) -> new PreventivoReminder(
                        rs.getString("tipo"),
                        rs.getString("nombre"),
                        rs.getDate("proxima_dosis").toLocalDate(),
                        rs.getString("observaciones"),
                        rs.getString("nombre_mascota"),
                        rs.getString("nombre_cliente"),
                        rs.getString("email_cliente")),
                Date.valueOf(hoy),
                Date.valueOf(hasta));
    }

    private SimpleMailMessage crearMensaje(PreventivoReminder preventivo) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(preventivo.emailCliente());
        message.setSubject("Recordatorio de " + etiquetaTipo(preventivo.tipo()) + " - Huellitas Felices");
        message.setText("""
                Hola %s,

                Te recordamos que %s tiene una proxima dosis pendiente.

                Tipo: %s
                Nombre: %s
                Fecha prevista: %s
                Observaciones: %s

                Contacta con la clinica para confirmar o agendar la visita.

                Huellitas Felices
                """.formatted(
                preventivo.nombreCliente(),
                preventivo.nombreMascota(),
                etiquetaTipo(preventivo.tipo()),
                preventivo.nombre(),
                preventivo.proximaDosis().format(FECHA_FORMATTER),
                preventivo.observaciones() != null && !preventivo.observaciones().isBlank()
                        ? preventivo.observaciones()
                        : "Sin observaciones"));

        return message;
    }

    private String etiquetaTipo(String tipo) {
        return "vacuna".equals(tipo) ? "vacuna" : "desparasitacion";
    }

    private record PreventivoReminder(
            String tipo,
            String nombre,
            LocalDate proximaDosis,
            String observaciones,
            String nombreMascota,
            String nombreCliente,
            String emailCliente) {
    }
}
