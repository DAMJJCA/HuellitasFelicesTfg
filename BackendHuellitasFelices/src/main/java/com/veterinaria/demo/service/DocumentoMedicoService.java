package com.veterinaria.demo.service;

import java.util.List;

import com.veterinaria.demo.dto.DocumentoMedicoRequest;
import com.veterinaria.demo.dto.DocumentoMedicoResponse;

public interface DocumentoMedicoService {

    List<DocumentoMedicoResponse> findAll();
    List<DocumentoMedicoResponse> findByMascota(Long idMascota);
    DocumentoMedicoResponse findById(Long id);
    DocumentoMedicoResponse save(DocumentoMedicoRequest request);
    DocumentoMedicoResponse update(Long id, DocumentoMedicoRequest request);
    DocumentoMedicoResponse updateArchivo(Long id, String url, String nombreArchivo, String mimeType, Long tamanoBytes, String rutaStorage);
    void deleteById(Long id);
}
