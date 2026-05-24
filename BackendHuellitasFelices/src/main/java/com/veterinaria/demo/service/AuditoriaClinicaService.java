package com.veterinaria.demo.service;

import java.util.List;

import com.veterinaria.demo.dto.AuditoriaClinicaResponse;

public interface AuditoriaClinicaService {

    void registrar(String entidad, Long idEntidad, String accion, String resumen);

    List<AuditoriaClinicaResponse> recientes();
}
