package com.veterinaria.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.veterinaria.demo.model.Cita;

public interface CitaRepository extends JpaRepository<Cita, Long> {

    List<Cita> findByMascota_Cliente_IdCliente(Long idCliente);

    Optional<Cita> findByIdCitaAndMascota_Cliente_IdCliente(Long idCita, Long idCliente);

    List<Cita> findByVeterinario_IdVeterinario(Long idVeterinario);

    Optional<Cita> findByIdCitaAndVeterinario_IdVeterinario(Long idCita, Long idVeterinario);
}
