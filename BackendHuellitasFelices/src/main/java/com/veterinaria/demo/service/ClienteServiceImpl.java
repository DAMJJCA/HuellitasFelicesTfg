package com.veterinaria.demo.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.veterinaria.demo.model.Cliente;
import com.veterinaria.demo.repository.ClienteRepository;

@Service
public class ClienteServiceImpl implements ClienteService {

    private final ClienteRepository repository;

    public ClienteServiceImpl(ClienteRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<Cliente> findAll() {
        return repository.findAll();
    }

    @Override
    public Cliente findById(Long id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public Cliente save(Cliente cliente) {
        return repository.save(cliente);
    }
    @Override
    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}