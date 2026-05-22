package com.veterinaria.demo.service;

import java.util.List;

import com.veterinaria.demo.dto.CitaDuracionRequest;
import com.veterinaria.demo.dto.CitaDuracionResponse;

public interface CitaDuracionService {
    List<CitaDuracionResponse> findAll();
    CitaDuracionResponse findByCita(Long idCita);
    CitaDuracionResponse save(Long idCita, CitaDuracionRequest request);
    int duracionMinutos(Long idCita, Integer fallback);
}
