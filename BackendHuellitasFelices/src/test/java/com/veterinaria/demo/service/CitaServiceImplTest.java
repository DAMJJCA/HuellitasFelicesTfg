package com.veterinaria.demo.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.Optional;

import org.junit.jupiter.api.Test;

import com.veterinaria.demo.model.Cita;
import com.veterinaria.demo.model.Consulta;
import com.veterinaria.demo.repository.CitaRepository;
import com.veterinaria.demo.repository.ConsultaRepository;
import com.veterinaria.demo.repository.MascotaRepository;
import com.veterinaria.demo.security.CurrentUserService;

class CitaServiceImplTest {

    @Test
    void noPermiteFinalizarCitaSinDiagnostico() {
        CitaRepository citaRepository = mock(CitaRepository.class);
        CurrentUserService currentUserService = mock(CurrentUserService.class);

        Cita cita = new Cita();
        cita.setIdCita(10L);
        cita.setFecha(LocalDate.now());
        cita.setHora("10:00");
        cita.setEstado("en_consulta");
        cita.setConsulta(new Consulta());

        when(currentUserService.isCliente()).thenReturn(false);
        when(currentUserService.isVeterinario()).thenReturn(false);
        when(citaRepository.findById(10L)).thenReturn(Optional.of(cita));

        CitaServiceImpl service = new CitaServiceImpl(
                citaRepository,
                mock(ConsultaRepository.class),
                mock(MascotaRepository.class),
                currentUserService,
                mock(DisponibilidadVeterinarioService.class),
                mock(CitaDuracionService.class),
                mock(AuditoriaClinicaService.class));

        assertThrows(IllegalArgumentException.class, () -> service.updateEstado(10L, "realizada"));
    }
}
