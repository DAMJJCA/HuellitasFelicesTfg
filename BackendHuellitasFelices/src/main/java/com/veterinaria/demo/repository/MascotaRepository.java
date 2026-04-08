package com.veterinaria.demo.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.veterinaria.demo.model.Mascota;

public interface MascotaRepository extends JpaRepository<Mascota, Long> {

}
