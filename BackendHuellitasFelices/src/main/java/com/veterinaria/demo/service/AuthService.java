package com.veterinaria.demo.service;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.veterinaria.demo.dto.AuthLoginRequest;
import com.veterinaria.demo.dto.AuthResponse;
import com.veterinaria.demo.model.RolUsuario;
import com.veterinaria.demo.model.Usuario;
import com.veterinaria.demo.security.AuthenticatedUser;
import com.veterinaria.demo.security.JwtService;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(AuthenticationManager authenticationManager, JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    public AuthResponse login(AuthLoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        AuthenticatedUser principal = (AuthenticatedUser) authentication.getPrincipal();
        Usuario usuario = principal.getUsuario();

        if (usuario.getRol() != RolUsuario.admin) {
            throw new BadCredentialsException("Acceso no autorizado");
        }

        String token = jwtService.generateToken(usuario);

        return new AuthResponse(
                token,
                "Bearer",
                usuario.getEmail(),
                usuario.getNombreUsuario(),
                usuario.getRol().name());
    }
}