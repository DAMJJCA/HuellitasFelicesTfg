package com.veterinaria.demo.service;

import java.util.List;
import com.veterinaria.demo.model.Consulta;

public interface ConsultaService {

    List<Consulta> findAll();
    Consulta findById(Long id);
    Consulta save(Consulta consulta);
    void deleteById(Long id);
    List<Consulta> findByMascota(Long idMascota);
}