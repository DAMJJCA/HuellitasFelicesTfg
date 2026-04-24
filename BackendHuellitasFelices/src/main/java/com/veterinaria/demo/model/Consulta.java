package com.veterinaria.demo.model;

import java.time.LocalDate;
import java.util.List;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "consultas")
public class Consulta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idConsulta;

    private LocalDate fecha;
    private String hora;
    private String diagnostico;
    private String observaciones;


    @OneToOne
    @JoinColumn(name = "id_cita")
    @JsonBackReference
    private Cita cita;


    @OneToMany(mappedBy = "consulta", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Tratamiento> tratamientos;


	public Consulta() {
		super();
	}


	public Long getIdConsulta() {
		return idConsulta;
	}


	public void setIdConsulta(Long idConsulta) {
		this.idConsulta = idConsulta;
	}


	public LocalDate getFecha() {
		return fecha;
	}


	public void setFecha(LocalDate fecha) {
		this.fecha = fecha;
	}


	public String getHora() {
		return hora;
	}


	public void setHora(String hora) {
		this.hora = hora;
	}


	public String getDiagnostico() {
		return diagnostico;
	}


	public void setDiagnostico(String diagnostico) {
		this.diagnostico = diagnostico;
	}


	public String getObservaciones() {
		return observaciones;
	}


	public void setObservaciones(String observaciones) {
		this.observaciones = observaciones;
	}


	public Cita getCita() {
		return cita;
	}


	public void setCita(Cita cita) {
		this.cita = cita;
	}


	public List<Tratamiento> getTratamientos() {
		return tratamientos;
	}


	public void setTratamientos(List<Tratamiento> tratamientos) {
		this.tratamientos = tratamientos;
	}

 
}