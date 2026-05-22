package com.veterinaria.demo.service;

import java.time.LocalDate;
import java.util.List;

import com.veterinaria.demo.dto.DisponibilidadVeterinarioRequest;
import com.veterinaria.demo.dto.DisponibilidadVeterinarioResponse;
import com.veterinaria.demo.dto.ExcepcionDisponibilidadRequest;
import com.veterinaria.demo.dto.ExcepcionDisponibilidadResponse;

public interface DisponibilidadVeterinarioService {
    List<DisponibilidadVeterinarioResponse> findAll();
    List<DisponibilidadVeterinarioResponse> findByVeterinario(Long idVeterinario);
    DisponibilidadVeterinarioResponse save(DisponibilidadVeterinarioRequest request);
    DisponibilidadVeterinarioResponse update(Long id, DisponibilidadVeterinarioRequest request);
    void delete(Long id);
    List<ExcepcionDisponibilidadResponse> findAllExcepciones();
    List<ExcepcionDisponibilidadResponse> findExcepcionesByVeterinario(Long idVeterinario);
    ExcepcionDisponibilidadResponse saveExcepcion(ExcepcionDisponibilidadRequest request);
    ExcepcionDisponibilidadResponse updateExcepcion(Long id, ExcepcionDisponibilidadRequest request);
    void deleteExcepcion(Long id);
    boolean estaDisponible(Long idVeterinario, LocalDate fecha, String hora);
}
