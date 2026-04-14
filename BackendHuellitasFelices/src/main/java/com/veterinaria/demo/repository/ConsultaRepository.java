package com.veterinaria.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import com.veterinaria.demo.model.Consulta;

public interface ConsultaRepository extends JpaRepository<Consulta, Long> {
	
	List<Consulta> findByCita_Mascota_IdMascota(Long idMascota);
}