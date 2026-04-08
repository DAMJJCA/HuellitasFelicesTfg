package com.veterinaria.demo.service;

import java.util.List;

import org.springframework.stereotype.Service;
import com.veterinaria.demo.model.Consulta;
import com.veterinaria.demo.repository.ConsultaRepository;

@Service
public class ConsultaServiceImpl implements ConsultaService {

    private final ConsultaRepository repo;

    public ConsultaServiceImpl(ConsultaRepository repo) {
        this.repo = repo;
    }

    @Override
    public List<Consulta> findAll() {
        return repo.findAll();
    }

    @Override
    public Consulta findById(Long id) {
        return repo.findById(id).orElse(null);
    }

    @Override
    public Consulta save(Consulta consulta) {
        return repo.save(consulta);
    }

    @Override
    public void deleteById(Long id) {
        repo.deleteById(id);
    }
}