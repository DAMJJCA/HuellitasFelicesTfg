package com.veterinaria.demo.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.veterinaria.demo.model.Cita;

public interface CitaRepository extends JpaRepository<Cita, Long> {

    List<Cita> findByEliminadoFalse();

    List<Cita> findByMascota_Cliente_IdClienteAndEliminadoFalse(Long idCliente);

    Optional<Cita> findByIdCitaAndMascota_Cliente_IdClienteAndEliminadoFalse(Long idCita, Long idCliente);

    List<Cita> findByVeterinario_IdVeterinarioAndEliminadoFalse(Long idVeterinario);

    Optional<Cita> findByIdCitaAndVeterinario_IdVeterinarioAndEliminadoFalse(Long idCita, Long idVeterinario);

    List<Cita> findByFechaAndEstadoNotIn(LocalDate fecha, List<String> estados);

    List<Cita> findByVeterinario_IdVeterinarioAndFechaAndHoraAndEstadoIn(
            Long idVeterinario,
            LocalDate fecha,
            String hora,
            List<String> estados);

    List<Cita> findByVeterinario_IdVeterinarioAndFechaAndEstadoInAndEliminadoFalse(
            Long idVeterinario,
            LocalDate fecha,
            List<String> estados);
}
