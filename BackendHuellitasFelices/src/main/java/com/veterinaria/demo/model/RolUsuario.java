package com.veterinaria.demo.model;

public enum RolUsuario {
    admin,
    cliente,
    veterinario;

    public String authority() {
        return "ROLE_" + name().toUpperCase();
    }
}