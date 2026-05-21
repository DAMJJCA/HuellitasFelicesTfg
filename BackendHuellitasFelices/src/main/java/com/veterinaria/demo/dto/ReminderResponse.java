package com.veterinaria.demo.dto;

public class ReminderResponse {

    private int encontradas;
    private int enviadas;
    private int omitidas;
    private String mensaje;

    public ReminderResponse(int encontradas, int enviadas, int omitidas, String mensaje) {
        this.encontradas = encontradas;
        this.enviadas = enviadas;
        this.omitidas = omitidas;
        this.mensaje = mensaje;
    }

    public int getEncontradas() {
        return encontradas;
    }

    public void setEncontradas(int encontradas) {
        this.encontradas = encontradas;
    }

    public int getEnviadas() {
        return enviadas;
    }

    public void setEnviadas(int enviadas) {
        this.enviadas = enviadas;
    }

    public int getOmitidas() {
        return omitidas;
    }

    public void setOmitidas(int omitidas) {
        this.omitidas = omitidas;
    }

    public String getMensaje() {
        return mensaje;
    }

    public void setMensaje(String mensaje) {
        this.mensaje = mensaje;
    }
}
