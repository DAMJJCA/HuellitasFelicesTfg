package com.veterinaria.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.veterinaria.demo.model.Cita;

public interface CitaRepository extends JpaRepository<Cita, Long> {

}