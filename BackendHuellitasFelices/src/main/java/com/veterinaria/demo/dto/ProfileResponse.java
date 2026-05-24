package com.veterinaria.demo.dto;

public class ProfileResponse {

    private final String email;
    private final String nombreUsuario;
    private final String rol;
    private final String profileImageUrl;

    public ProfileResponse(String email, String nombreUsuario, String rol, String profileImageUrl) {
        this.email = email;
        this.nombreUsuario = nombreUsuario;
        this.rol = rol;
        this.profileImageUrl = profileImageUrl;
    }

    public String getEmail() {
        return email;
    }

    public String getNombreUsuario() {
        return nombreUsuario;
    }

    public String getRol() {
        return rol;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }
}
