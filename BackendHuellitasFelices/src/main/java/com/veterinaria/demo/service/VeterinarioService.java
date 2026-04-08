package com.veterinaria.demo.service;
import java.util.List;

import com.veterinaria.demo.model.Veterinario;

public interface VeterinarioService {

    List<Veterinario> findAll();
    Veterinario findById(Long id);
    Veterinario save(Veterinario veterinario);
    void deleteById(Long id);
}