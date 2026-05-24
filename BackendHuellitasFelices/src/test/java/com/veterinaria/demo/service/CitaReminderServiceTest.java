package com.veterinaria.demo.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;

import com.veterinaria.demo.dto.ReminderResponse;
import com.veterinaria.demo.model.Cita;
import com.veterinaria.demo.model.Cliente;
import com.veterinaria.demo.model.Mascota;
import com.veterinaria.demo.repository.CitaRepository;

class CitaReminderServiceTest {

    @Test
    void omiteRecordatorioIndividualSiClienteNoTieneEmail() {
        CitaRepository citaRepository = mock(CitaRepository.class);
        Cita cita = citaConCliente("", "600111222");
        when(citaRepository.findById(1L)).thenReturn(Optional.of(cita));

        CitaReminderService service = new CitaReminderService(
                citaRepository,
                emptyMailSenderProvider(),
                true,
                "no-reply@test.local",
                new NotificationTemplateService());

        ReminderResponse response = service.enviarRecordatorioCita(1L);

        assertEquals(1, response.getEncontradas());
        assertEquals(0, response.getEnviadas());
        assertEquals(1, response.getOmitidas());
    }

    @Test
    void omiteRecordatorioIndividualSiEmailEstaDesactivado() {
        CitaRepository citaRepository = mock(CitaRepository.class);
        Cita cita = citaConCliente("cliente@test.local", "600111222");
        when(citaRepository.findById(1L)).thenReturn(Optional.of(cita));

        CitaReminderService service = new CitaReminderService(
                citaRepository,
                emptyMailSenderProvider(),
                false,
                "no-reply@test.local",
                new NotificationTemplateService());

        ReminderResponse response = service.enviarRecordatorioCita(1L);

        assertEquals(1, response.getEncontradas());
        assertEquals(0, response.getEnviadas());
        assertEquals(1, response.getOmitidas());
    }

    private Cita citaConCliente(String email, String telefono) {
        Cliente cliente = new Cliente();
        cliente.setNombre("Ana");
        cliente.setEmail(email);
        cliente.setTelefono(telefono);

        Mascota mascota = new Mascota();
        mascota.setNombre("Coco");
        mascota.setCliente(cliente);

        Cita cita = new Cita();
        cita.setIdCita(1L);
        cita.setFecha(LocalDate.now().plusDays(1));
        cita.setHora("10:00");
        cita.setEstado("programada");
        cita.setMotivo("Revision general");
        cita.setMascota(mascota);
        return cita;
    }

    private ObjectProvider<JavaMailSender> emptyMailSenderProvider() {
        return new ObjectProvider<>() {
            @Override
            public JavaMailSender getObject(Object... args) {
                return null;
            }

            @Override
            public JavaMailSender getIfAvailable() {
                return null;
            }

            @Override
            public JavaMailSender getIfUnique() {
                return null;
            }

            @Override
            public JavaMailSender getObject() {
                return null;
            }
        };
    }
}
