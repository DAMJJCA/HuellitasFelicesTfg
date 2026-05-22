package com.veterinaria.demo.service;

import java.util.List;
import java.util.Set;

import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.veterinaria.demo.dto.CitaDuracionRequest;
import com.veterinaria.demo.dto.CitaDuracionResponse;
import com.veterinaria.demo.repository.CitaRepository;

@Service
public class CitaDuracionServiceImpl implements CitaDuracionService {

    private static final Set<Integer> DURACIONES_PERMITIDAS = Set.of(15, 30, 45, 60);

    private final JdbcTemplate jdbcTemplate;
    private final CitaRepository citaRepository;

    public CitaDuracionServiceImpl(JdbcTemplate jdbcTemplate, CitaRepository citaRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.citaRepository = citaRepository;
    }

    @Override
    public List<CitaDuracionResponse> findAll() {
        return jdbcTemplate.query(
                "select id_cita, duracion_minutos from cita_duraciones order by id_cita",
                (rs, rowNum) -> new CitaDuracionResponse(rs.getLong("id_cita"), rs.getInt("duracion_minutos")));
    }

    @Override
    public CitaDuracionResponse findByCita(Long idCita) {
        return new CitaDuracionResponse(idCita, duracionMinutos(idCita, 30));
    }

    @Override
    public CitaDuracionResponse save(Long idCita, CitaDuracionRequest request) {
        if (!citaRepository.existsById(idCita)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "La cita no existe");
        }

        int duracion = validarDuracion(request.getDuracionMinutos());
        jdbcTemplate.update("""
                insert into cita_duraciones (id_cita, duracion_minutos)
                values (?, ?)
                on conflict (id_cita)
                do update set duracion_minutos = excluded.duracion_minutos
                """, idCita, duracion);

        return new CitaDuracionResponse(idCita, duracion);
    }

    @Override
    public int duracionMinutos(Long idCita, Integer fallback) {
        if (idCita == null) {
            return validarDuracion(fallback);
        }

        try {
            Integer duracion = jdbcTemplate.queryForObject(
                    "select duracion_minutos from cita_duraciones where id_cita = ?",
                    Integer.class,
                    idCita);
            return validarDuracion(duracion);
        } catch (DataAccessException ex) {
            return validarDuracion(fallback);
        }
    }

    private int validarDuracion(Integer duracion) {
        int valor = duracion == null ? 30 : duracion;
        if (!DURACIONES_PERMITIDAS.contains(valor)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La duracion debe ser 15, 30, 45 o 60 minutos");
        }
        return valor;
    }
}
