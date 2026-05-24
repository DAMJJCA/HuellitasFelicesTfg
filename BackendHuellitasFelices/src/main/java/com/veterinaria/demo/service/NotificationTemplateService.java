package com.veterinaria.demo.service;

import java.time.format.DateTimeFormatter;

import org.springframework.stereotype.Service;

import com.veterinaria.demo.model.Cita;
import com.veterinaria.demo.model.Cliente;

@Service
public class NotificationTemplateService {

    private static final DateTimeFormatter FECHA_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public String citaReminderEmail(Cita cita, Cliente cliente) {
        return """
                Hola %s,

                Te recordamos tu cita en Huellitas Felices.

                Mascota: %s
                Fecha: %s
                Hora: %s
                Motivo: %s
                Veterinario: %s

                Si necesitas modificar o cancelar la cita, contacta con la clinica.

                Huellitas Felices
                """.formatted(
                cliente.getNombre(),
                mascota(cita),
                cita.getFecha() != null ? cita.getFecha().format(FECHA_FORMATTER) : "Sin fecha",
                cita.getHora() != null ? cita.getHora() : "Sin hora",
                cita.getMotivo() != null ? cita.getMotivo() : "Sin motivo",
                cita.getVeterinario() != null ? cita.getVeterinario().getNombre() : "Sin veterinario asignado");
    }

    public String citaReminderCorto(Cita cita) {
        return "Huellitas Felices: recordatorio de cita para %s el %s a las %s. Si no puedes asistir, contacta con la clinica."
                .formatted(
                        mascota(cita),
                        cita.getFecha() != null ? cita.getFecha().format(FECHA_FORMATTER) : "fecha pendiente",
                        cita.getHora() != null ? cita.getHora() : "hora pendiente");
    }

    private String mascota(Cita cita) {
        return cita.getMascota() != null ? cita.getMascota().getNombre() : "Sin mascota asignada";
    }
}
