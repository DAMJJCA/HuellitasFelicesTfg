package com.veterinaria.demo.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.veterinaria.demo.model.Cita;

public interface CitaRepository extends JpaRepository<Cita, Long> {

    List<Cita> findByMascota_Cliente_IdCliente(Long idCliente);

    Optional<Cita> findByIdCitaAndMascota_Cliente_IdCliente(Long idCita, Long idCliente);

    List<Cita> findByVeterinario_IdVeterinario(Long idVeterinario);

    Optional<Cita> findByIdCitaAndVeterinario_IdVeterinario(Long idCita, Long idVeterinario);

    List<Cita> findByFechaAndEstadoNotIn(LocalDate fecha, List<String> estados);

    List<Cita> findByVeterinario_IdVeterinarioAndFechaAndHoraAndEstadoIn(
            Long idVeterinario,
            LocalDate fecha,
            String hora,
            List<String> estados);

    List<Cita> findByVeterinario_IdVeterinarioAndFechaAndEstadoIn(
            Long idVeterinario,
            LocalDate fecha,
            List<String> estados);
}
