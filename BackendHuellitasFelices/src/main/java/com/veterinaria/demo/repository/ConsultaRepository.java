package com.veterinaria.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.veterinaria.demo.model.Consulta;

public interface ConsultaRepository extends JpaRepository<Consulta, Long> {
}