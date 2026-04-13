package com.veterinaria.demo.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.veterinaria.demo.model.Cita;
import com.veterinaria.demo.model.Consulta;
import com.veterinaria.demo.repository.CitaRepository;
import com.veterinaria.demo.repository.ConsultaRepository;

@Service
public class CitaServiceImpl implements CitaService {

    private final CitaRepository citaRepo;
    private final ConsultaRepository consultaRepo;

    public CitaServiceImpl(CitaRepository citaRepo, ConsultaRepository consultaRepo) {
        this.citaRepo = citaRepo;
        this.consultaRepo = consultaRepo;
    }

    @Override
    public List<Cita> findAll() {
        return citaRepo.findAll();
    }

    @Override
    public Cita findById(Long id) {
        return citaRepo.findById(id).orElse(null);
    }

    /**
     * Guarda una cita y crea AUTOMÁTICAMENTE una consulta asociada
     * con la MISMA fecha y hora de la cita.
     */
    @Override
    @Transactional
    public Cita save(Cita cita) {

        //  Guardar la cita
        Cita saved = citaRepo.save(cita);

        //  Evitar crear consulta duplicada (por seguridad)
        if (saved.getConsulta() == null) {

            Consulta consulta = new Consulta();

            //  COPIAR FECHA Y HORA DESDE LA CITA
            consulta.setFecha(saved.getFecha());
            consulta.setHora(saved.getHora());

            consulta.setDiagnostico("");
            consulta.setObservaciones("");
            consulta.setCita(saved);

            consultaRepo.save(consulta);

            saved.setConsulta(consulta);
        }

        return saved;
    }

    @Override
    public void deleteById(Long id) {
        citaRepo.deleteById(id);
    }
}
