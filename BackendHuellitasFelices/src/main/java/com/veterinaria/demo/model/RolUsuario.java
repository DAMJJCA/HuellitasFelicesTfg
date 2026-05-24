package com.veterinaria.demo.model;

public enum RolUsuario {
    admin,
    cliente,
    veterinario,
    recepcion,
    auxiliar;

    public String authority() {
        return "ROLE_" + name().toUpperCase();
    }
}
