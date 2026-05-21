package com.veterinaria.demo.service;

import java.util.List;

import com.veterinaria.demo.dto.PreventivoRequest;
import com.veterinaria.demo.dto.PreventivoResponse;

public interface PreventivoService {

    List<PreventivoResponse> findAll();
    List<PreventivoResponse> findProximos();
    PreventivoResponse findById(Long id);
    PreventivoResponse save(PreventivoRequest request);
    PreventivoResponse update(Long id, PreventivoRequest request);
    void deleteById(Long id);
}
