package com.veterinaria.demo.security;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.veterinaria.demo.model.RolUsuario;
import com.veterinaria.demo.model.Usuario;

@Service
public class CurrentUserService {

    public Usuario getAuthenticatedUsuario() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser principal)) {
            throw new AccessDeniedException("Usuario no autenticado");
        }
        return principal.getUsuario();
    }

    public boolean hasRole(RolUsuario rol) {
        try {
            return getAuthenticatedUsuario().getRol() == rol;
        } catch (AccessDeniedException ex) {
            return false;
        }
    }

    public boolean isCliente() {
        return hasRole(RolUsuario.cliente);
    }

    public boolean isVeterinario() {
        return hasRole(RolUsuario.veterinario);
    }

    public boolean isAdmin() {
        return hasRole(RolUsuario.admin);
    }

    public boolean isRecepcion() {
        return hasRole(RolUsuario.recepcion);
    }

    public boolean isAuxiliar() {
        return hasRole(RolUsuario.auxiliar);
    }

    public boolean isRecepcionOAdmin() {
        return isAdmin() || isRecepcion();
    }

    public boolean isClinicalStaff() {
        return isAdmin() || isVeterinario() || isAuxiliar();
    }

    public Long getAuthenticatedClienteIdOrThrow() {
        Usuario usuario = getAuthenticatedUsuario();
        if (usuario.getRol() != RolUsuario.cliente || usuario.getIdCliente() == null) {
            throw new AccessDeniedException("Tu usuario cliente no esta enlazado con una ficha de cliente. Revisa usuarios.id_cliente en Supabase.");
        }
        return usuario.getIdCliente();
    }

    public Long getAuthenticatedVeterinarioIdOrThrow() {
        Usuario usuario = getAuthenticatedUsuario();
        if (usuario.getRol() != RolUsuario.veterinario || usuario.getIdVeterinario() == null) {
            throw new AccessDeniedException("Tu usuario veterinario no esta enlazado con una ficha de veterinario. Revisa usuarios.id_veterinario en Supabase.");
        }
        return usuario.getIdVeterinario();
    }
}
