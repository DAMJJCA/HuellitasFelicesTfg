package com.veterinaria.demo.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.veterinaria.demo.model.Tratamiento;

public interface TratamientoRepository extends JpaRepository<Tratamiento, Long> {

    List<Tratamiento> findByConsulta_IdConsulta(Long idConsulta);
    List<Tratamiento> findByConsulta_Cita_Mascota_IdMascota(Long idMascota);
    List<Tratamiento> findByConsulta_Cita_Mascota_Cliente_IdCliente(Long idCliente);
    List<Tratamiento> findByConsulta_IdConsultaAndConsulta_Cita_Mascota_Cliente_IdCliente(Long idConsulta, Long idCliente);
    List<Tratamiento> findByConsulta_Cita_Mascota_IdMascotaAndConsulta_Cita_Mascota_Cliente_IdCliente(
            Long idMascota,
            Long idCliente);
}
