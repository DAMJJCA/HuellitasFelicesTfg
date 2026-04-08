package com.veterinaria.demo.service;

import java.util.List;
import com.veterinaria.demo.model.Cliente;

public interface  ClienteService {
 
    List<Cliente> findAll();
    Cliente findById(Long id);
    Cliente save(Cliente cliente);
    void deleteById(Long id);
}
