package com.veterinaria.demo.service;

import java.time.LocalDateTime;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.veterinaria.demo.dto.AuthLoginRequest;
import com.veterinaria.demo.dto.AuthResponse;
import com.veterinaria.demo.dto.AuthRegisterClienteRequest;
import com.veterinaria.demo.model.Cliente;
import com.veterinaria.demo.model.RolUsuario;
import com.veterinaria.demo.model.Usuario;
import com.veterinaria.demo.repository.ClienteRepository;
import com.veterinaria.demo.repository.UsuarioRepository;
import com.veterinaria.demo.security.AuthenticatedUser;
import com.veterinaria.demo.security.JwtService;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;
    private final ClienteRepository clienteRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            UsuarioRepository usuarioRepository,
            ClienteRepository clienteRepository,
            PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
        this.clienteRepository = clienteRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse login(AuthLoginRequest request) {
        if (isBlank(request.getEmail()) || isBlank(request.getPassword())) {
            throw new BadCredentialsException("Email y contrasena son requeridos");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        AuthenticatedUser principal = (AuthenticatedUser) authentication.getPrincipal();
        Usuario usuario = principal.getUsuario();

        if (!usuario.isActivo()) {
            throw new BadCredentialsException("Usuario inactivo");
        }

        String token = jwtService.generateToken(usuario);

        return new AuthResponse(
                token,
                "Bearer",
                usuario.getEmail(),
                usuario.getNombreUsuario(),
                usuario.getRol().name(),
                usuario.getFotoPerfilUrl());
    }

    @Transactional
    public AuthResponse registerCliente(AuthRegisterClienteRequest request) {
        String nombre = normalize(request.getNombre());
        String apellidos = normalize(request.getApellidos());
        String email = normalizeEmail(request.getEmail());
        String telefono = normalize(request.getTelefono());
        String direccion = normalize(request.getDireccion());
        String password = request.getPassword();

        if (isBlank(nombre) || isBlank(apellidos) || isBlank(email) || isBlank(telefono) || isBlank(password)) {
            throw new IllegalArgumentException("Nombre, apellidos, email, telefono y contrasena son obligatorios");
        }

        if (password.length() < 6) {
            throw new IllegalArgumentException("La contrasena debe tener al menos 6 caracteres");
        }

        if (usuarioRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalStateException("Ya existe un usuario con ese email");
        }

        Cliente cliente = new Cliente();
        cliente.setNombre(nombre);
        cliente.setApellidos(apellidos);
        cliente.setEmail(email);
        cliente.setTelefono(telefono);
        cliente.setDireccion(direccion);
        cliente.setFechaRegistro(LocalDateTime.now());
        Cliente clienteGuardado = clienteRepository.save(cliente);

        Usuario usuario = new Usuario();
        usuario.setNombreUsuario((nombre + " " + apellidos).trim());
        usuario.setEmail(email);
        usuario.setPasswordHash(passwordEncoder.encode(password));
        usuario.setRol(RolUsuario.cliente);
        usuario.setActivo(true);
        usuario.setIdCliente(clienteGuardado.getIdCliente());

        try {
            Usuario usuarioGuardado = usuarioRepository.save(usuario);
            String token = jwtService.generateToken(usuarioGuardado);

            return new AuthResponse(
                    token,
                    "Bearer",
                    usuarioGuardado.getEmail(),
                    usuarioGuardado.getNombreUsuario(),
                    usuarioGuardado.getRol().name(),
                    usuarioGuardado.getFotoPerfilUrl());
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalStateException("No se pudo registrar el usuario");
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private static String normalize(String value) {
        return value == null ? null : value.trim();
    }

    private static String normalizeEmail(String value) {
        return value == null ? null : value.trim().toLowerCase();
    }
}
