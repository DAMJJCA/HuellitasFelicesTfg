package com.veterinaria.demo.service;

import java.util.List;

import com.veterinaria.demo.model.Cita;

public interface CitaService {

    List<Cita> findAll();
    Cita findById(Long id);
    Cita save(Cita cita);
    void deleteById(Long id);

}
