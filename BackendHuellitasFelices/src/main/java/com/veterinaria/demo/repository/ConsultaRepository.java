package com.veterinaria.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import com.veterinaria.demo.model.Consulta;

public interface ConsultaRepository extends JpaRepository<Consulta, Long> {
	
	List<Consulta> findByCita_Mascota_IdMascota(Long idMascota);

    List<Consulta> findByCita_Mascota_Cliente_IdCliente(Long idCliente);

    List<Consulta> findByCita_Veterinario_IdVeterinario(Long idVeterinario);

    Optional<Consulta> findByIdConsultaAndCita_Mascota_Cliente_IdCliente(Long idConsulta, Long idCliente);

    Optional<Consulta> findByIdConsultaAndCita_Veterinario_IdVeterinario(Long idConsulta, Long idVeterinario);

    List<Consulta> findByCita_Mascota_IdMascotaAndCita_Mascota_Cliente_IdCliente(Long idMascota, Long idCliente);

    List<Consulta> findByCita_Mascota_IdMascotaAndCita_Veterinario_IdVeterinario(Long idMascota, Long idVeterinario);
}
