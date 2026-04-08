package com.veterinaria.demo.service;

import java.util.List;
import com.veterinaria.demo.model.Tratamiento;

public interface TratamientoService {

    List<Tratamiento> findAll();
    List<Tratamiento> findByConsulta(Long idConsulta);

    Tratamiento findById(Long id);
    Tratamiento save(Tratamiento tratamiento);
    void deleteById(Long id);
}