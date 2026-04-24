package com.veterinaria.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.veterinaria.demo.model.Veterinario;

public interface VeterinarioRepository extends JpaRepository<Veterinario, Long> {

    boolean existsByEmailIgnoreCase(String email);
}
