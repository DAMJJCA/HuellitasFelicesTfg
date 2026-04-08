package com.veterinaria.demo.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.veterinaria.demo.model.Tratamiento;

public interface TratamientoRepository extends JpaRepository<Tratamiento, Long> {

    // Obtener tratamientos por consulta
    List<Tratamiento> findByConsulta_IdConsulta(Long idConsulta);
}