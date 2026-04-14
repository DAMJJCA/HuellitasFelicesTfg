package com.veterinaria.demo.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.veterinaria.demo.model.Tratamiento;
import com.veterinaria.demo.repository.TratamientoRepository;

@Service
public class TratamientoServiceImpl implements TratamientoService {

    private final TratamientoRepository repo;

    public TratamientoServiceImpl(TratamientoRepository repo) {
        this.repo = repo;
    }

    @Override
    public List<Tratamiento> findAll() {
        return repo.findAll();
    }

    @Override
    public List<Tratamiento> findByConsulta(Long idConsulta) {
        return repo.findByConsulta_IdConsulta(idConsulta);
    }
    

    @Override
	public List<Tratamiento> findByMascota(Long idMascota) {
    	return repo.findByConsulta_Cita_Mascota_IdMascota(idMascota);
	}


    @Override
    public Tratamiento findById(Long id) {
        return repo.findById(id).orElse(null);
    }

    @Override
    public Tratamiento save(Tratamiento tratamiento) {
        return repo.save(tratamiento);
    }

    @Override
    public void deleteById(Long id) {
        repo.deleteById(id);
    }
}