package com.veterinaria.demo.dto;

import java.time.LocalDate;
import java.util.List;

import com.veterinaria.demo.model.Consulta;
import com.veterinaria.demo.model.Tratamiento;

public class ConsultaResponse {

    private Long idConsulta;
    private LocalDate fecha;
    private String hora;
    private String diagnostico;
    private String observaciones;
    private boolean tratamiento;
    private Long idCita;
    private String nombreMascota;
    private List<Long> idsTratamientos;

    public static ConsultaResponse from(Consulta consulta, List<Tratamiento> tratamientos) {
        ConsultaResponse response = new ConsultaResponse();
        response.idConsulta = consulta.getIdConsulta();
        response.fecha = consulta.getFecha();
        response.hora = consulta.getHora();
        response.diagnostico = consulta.getDiagnostico();
        response.observaciones = consulta.getObservaciones();
        response.idCita = consulta.getIdCita();
        response.nombreMascota = consulta.getNombreMascota();
        response.idsTratamientos = tratamientos.stream()
                .map(Tratamiento::getIdTratamiento)
                .toList();
        response.tratamiento = !response.idsTratamientos.isEmpty();
        return response;
    }

    public Long getIdConsulta() {
        return idConsulta;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public String getHora() {
        return hora;
    }

    public String getDiagnostico() {
        return diagnostico;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public boolean isTratamiento() {
        return tratamiento;
    }

    public Long getIdCita() {
        return idCita;
    }

    public String getNombreMascota() {
        return nombreMascota;
    }

    public List<Long> getIdsTratamientos() {
        return idsTratamientos;
    }
}
