package com.veterinaria.demo.dto;

public class CitaDuracionResponse {
    private Long idCita;
    private Integer duracionMinutos;

    public CitaDuracionResponse(Long idCita, Integer duracionMinutos) {
        this.idCita = idCita;
        this.duracionMinutos = duracionMinutos;
    }

    public Long getIdCita() {
        return idCita;
    }

    public void setIdCita(Long idCita) {
        this.idCita = idCita;
    }

    public Integer getDuracionMinutos() {
        return duracionMinutos;
    }

    public void setDuracionMinutos(Integer duracionMinutos) {
        this.duracionMinutos = duracionMinutos;
    }
}
