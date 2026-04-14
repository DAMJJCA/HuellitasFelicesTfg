package com.veterinaria.demo.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.veterinaria.demo.model.Cliente;
import com.veterinaria.demo.model.Mascota;
import com.veterinaria.demo.repository.ClienteRepository;
import com.veterinaria.demo.repository.MascotaRepository;

@Service
public class MascotaServiceImpl implements MascotaService {

    private final MascotaRepository repository;
    private final ClienteRepository clienteRepository;

    public MascotaServiceImpl(MascotaRepository repository,
                              ClienteRepository clienteRepository) {
        this.repository = repository;
        this.clienteRepository = clienteRepository;
    }

    @Override
    public List<Mascota> findAll() {
        return repository.findAll();
    }

    @Override
    public Mascota findById(Long id) {
        return repository.findById(id).orElse(null);
    }

    // ✅ MÉTODO DEL DASHBOARD
    @Override
    public long count() {
        return repository.count();
    }

    @Override
    @Transactional
    public Mascota save(Mascota mascota) {

        Cliente cliente = clienteRepository.findById(
                mascota.getCliente().getIdCliente()
        ).orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        mascota.setCliente(cliente);

        return repository.save(mascota);
    }

    @Override
    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
