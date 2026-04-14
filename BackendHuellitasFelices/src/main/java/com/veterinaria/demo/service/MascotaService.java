package com.veterinaria.demo.service;

import java.util.List;
import com.veterinaria.demo.model.Mascota;

public interface MascotaService {

    List<Mascota> findAll();
    Mascota findById(Long id);
    Mascota save(Mascota mascota);
    void deleteById(Long id);
    long count();

}
