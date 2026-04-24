package com.veterinaria.demo.service;
import java.util.List;

import com.veterinaria.demo.dto.VeterinarioCreateRequest;
import com.veterinaria.demo.model.Veterinario;

public interface VeterinarioService {

    List<Veterinario> findAll();
    Veterinario findById(Long id);
    Veterinario createWithUser(VeterinarioCreateRequest request);
    Veterinario save(Veterinario veterinario);
    void deleteById(Long id);
}
