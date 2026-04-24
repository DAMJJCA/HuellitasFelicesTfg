package com.veterinaria.demo.repository;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.veterinaria.demo.model.Mascota;

public interface MascotaRepository extends JpaRepository<Mascota, Long> {

    List<Mascota> findByCliente_IdCliente(Long idCliente);

    Optional<Mascota> findByIdMascotaAndCliente_IdCliente(Long idMascota, Long idCliente);

    boolean existsByIdMascotaAndCliente_IdCliente(Long idMascota, Long idCliente);

    long countByCliente_IdCliente(Long idCliente);
}
