package com.veterinaria.demo.dto;

public class AuthResponse {

    private final String token;
    private final String type;
    private final String email;
    private final String nombreUsuario;
    private final String rol;
    private final String profileImageUrl;

    public AuthResponse(String token, String type, String email, String nombreUsuario, String rol, String profileImageUrl) {
        this.token = token;
        this.type = type;
        this.email = email;
        this.nombreUsuario = nombreUsuario;
        this.rol = rol;
        this.profileImageUrl = profileImageUrl;
    }

    public String getToken() {
        return token;
    }

    public String getType() {
        return type;
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
