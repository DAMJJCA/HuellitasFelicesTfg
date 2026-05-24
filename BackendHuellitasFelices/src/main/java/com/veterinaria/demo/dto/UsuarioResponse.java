package com.veterinaria.demo.dto;

import java.time.LocalDateTime;

import com.veterinaria.demo.model.RolUsuario;
import com.veterinaria.demo.model.Usuario;

public record UsuarioResponse(
        Long idUsuario,
        String nombreUsuario,
        String email,
        RolUsuario rol,
        boolean activo,
        Long idCliente,
        Long idVeterinario,
        LocalDateTime creadoEn,
        LocalDateTime actualizadoEn,
        String profileImageUrl) {

    public static UsuarioResponse from(Usuario usuario) {
        return new UsuarioResponse(
                usuario.getIdUsuario(),
                usuario.getNombreUsuario(),
                usuario.getEmail(),
                usuario.getRol(),
                usuario.isActivo(),
                usuario.getIdCliente(),
                usuario.getIdVeterinario(),
                usuario.getCreadoEn(),
                usuario.getActualizadoEn(),
                usuario.getFotoPerfilUrl());
    }
}
