package com.veterinaria.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.veterinaria.demo.model.Cliente;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {}
    
