package com.veterinaria.demo.service;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.veterinaria.demo.dto.UsuarioInternoRequest;
import com.veterinaria.demo.dto.UsuarioResponse;
import com.veterinaria.demo.model.RolUsuario;
import com.veterinaria.demo.model.Usuario;
import com.veterinaria.demo.repository.UsuarioRepository;

@Service
public class UsuarioAdminService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    public UsuarioAdminService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder, JdbcTemplate jdbcTemplate) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponse> listar() {
        return jdbcTemplate.query("""
                select id_usuario, nombre_usuario, email, rol, activo, id_cliente, id_veterinario,
                       creado_en, actualizado_en, foto_perfil_url
                from usuarios
                order by creado_en desc nulls last, id_usuario desc
                """,
                (rs, rowNum) -> new UsuarioResponse(
                        rs.getLong("id_usuario"),
                        rs.getString("nombre_usuario"),
                        rs.getString("email"),
                        RolUsuario.valueOf(rs.getString("rol")),
                        rs.getBoolean("activo"),
                        rs.getObject("id_cliente") == null ? null : rs.getLong("id_cliente"),
                        rs.getObject("id_veterinario") == null ? null : rs.getLong("id_veterinario"),
                        rs.getTimestamp("creado_en") == null ? null : rs.getTimestamp("creado_en").toLocalDateTime(),
                        rs.getTimestamp("actualizado_en") == null ? null : rs.getTimestamp("actualizado_en").toLocalDateTime(),
                        rs.getString("foto_perfil_url")));
    }

    @Transactional
    public UsuarioResponse crearInterno(UsuarioInternoRequest request) {
        validarBasico(request, true);
        validarRolInterno(request.getRol());

        if (usuarioRepository.existsByEmailIgnoreCase(request.getEmail().trim())) {
            throw new IllegalArgumentException("Ya existe un usuario con ese email");
        }

        Usuario usuario = new Usuario();
        usuario.setNombreUsuario(request.getNombreUsuario().trim());
        usuario.setEmail(request.getEmail().trim().toLowerCase());
        usuario.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        usuario.setRol(request.getRol());
        usuario.setActivo(request.getActivo() == null || request.getActivo());
        usuario.setIdCliente(null);
        usuario.setIdVeterinario(null);

        return UsuarioResponse.from(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioResponse actualizarInterno(Long id, UsuarioInternoRequest request) {
        validarBasico(request, false);
        validarRolInterno(request.getRol());

        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("El usuario no existe"));

        if (usuario.getRol() == RolUsuario.cliente || usuario.getRol() == RolUsuario.veterinario) {
            throw new IllegalArgumentException("Este usuario esta vinculado a una ficha clinica y debe editarse desde su modulo");
        }

        String email = request.getEmail().trim().toLowerCase();
        usuarioRepository.findByEmailIgnoreCase(email).ifPresent(existing -> {
            if (!existing.getIdUsuario().equals(id)) {
                throw new IllegalArgumentException("Ya existe un usuario con ese email");
            }
        });

        usuario.setNombreUsuario(request.getNombreUsuario().trim());
        usuario.setEmail(email);
        usuario.setRol(request.getRol());
        usuario.setActivo(request.getActivo() == null || request.getActivo());

        String password = request.getPassword();
        if (password != null && !password.isBlank()) {
            if (password.trim().length() < 6) {
                throw new IllegalArgumentException("La contrasena debe tener al menos 6 caracteres");
            }
            usuario.setPasswordHash(passwordEncoder.encode(password.trim()));
        }

        return UsuarioResponse.from(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioResponse cambiarActivo(Long id, boolean activo) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("El usuario no existe"));
        usuario.setActivo(activo);
        return UsuarioResponse.from(usuarioRepository.save(usuario));
    }

    private void validarBasico(UsuarioInternoRequest request, boolean requierePassword) {
        if (request == null) {
            throw new IllegalArgumentException("Debes enviar los datos del usuario");
        }
        if (request.getNombreUsuario() == null || request.getNombreUsuario().isBlank()) {
            throw new IllegalArgumentException("Debes indicar el nombre del usuario");
        }
        if (request.getEmail() == null || request.getEmail().isBlank() || !request.getEmail().contains("@")) {
            throw new IllegalArgumentException("Debes indicar un email valido");
        }
        if (requierePassword && (request.getPassword() == null || request.getPassword().trim().length() < 6)) {
            throw new IllegalArgumentException("La contrasena debe tener al menos 6 caracteres");
        }
    }

    private void validarRolInterno(RolUsuario rol) {
        if (rol == null || !(rol == RolUsuario.admin || rol == RolUsuario.recepcion || rol == RolUsuario.auxiliar)) {
            throw new IllegalArgumentException("Solo se pueden gestionar usuarios internos desde esta pantalla");
        }
    }
}
