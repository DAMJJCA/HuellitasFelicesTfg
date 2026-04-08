package com.veterinaria.demo.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.veterinaria.demo.model.Veterinario;
import com.veterinaria.demo.repository.VeterinarioRepository;

@Service
public class VeterinarioServiceImpl implements VeterinarioService {

    private final VeterinarioRepository repository;

    public VeterinarioServiceImpl(VeterinarioRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<Veterinario> findAll() {
        return repository.findAll();
    }

    @Override
    public Veterinario findById(Long id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public Veterinario save(Veterinario veterinario) {
        return repository.save(veterinario);
    }

    @Override
    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}