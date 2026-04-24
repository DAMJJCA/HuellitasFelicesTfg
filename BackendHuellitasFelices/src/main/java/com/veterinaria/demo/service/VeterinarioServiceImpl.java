package com.veterinaria.demo.service;

import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.veterinaria.demo.dto.VeterinarioCreateRequest;
import com.veterinaria.demo.model.RolUsuario;
import com.veterinaria.demo.model.Usuario;
import com.veterinaria.demo.model.Veterinario;
import com.veterinaria.demo.repository.UsuarioRepository;
import com.veterinaria.demo.repository.VeterinarioRepository;

@Service
public class VeterinarioServiceImpl implements VeterinarioService {

    private final VeterinarioRepository repository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public VeterinarioServiceImpl(
            VeterinarioRepository repository,
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public List<Veterinario> findAll() {
        return repository.findAll();
    }

    @Override
    public Veterinario findById(Long id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    @Transactional
    public Veterinario createWithUser(VeterinarioCreateRequest request) {
        String nombre = normalize(request.getNombre());
        String especialidad = normalize(request.getEspecialidad());
        String telefono = normalize(request.getTelefono());
        String email = normalizeEmail(request.getEmail());
        String password = request.getPassword();

        if (isBlank(nombre) || isBlank(especialidad) || isBlank(telefono) || isBlank(email) || isBlank(password)) {
            throw new IllegalArgumentException(
                    "Nombre, especialidad, telefono, email y contrasena son obligatorios");
        }

        if (password.length() < 6) {
            throw new IllegalArgumentException("La contrasena debe tener al menos 6 caracteres");
        }

        if (usuarioRepository.existsByEmailIgnoreCase(email) || repository.existsByEmailIgnoreCase(email)) {
            throw new IllegalStateException("Ya existe un usuario con ese email");
        }

        Veterinario veterinario = new Veterinario();
        veterinario.setNombre(nombre);
        veterinario.setEspecialidad(especialidad);
        veterinario.setTelefono(telefono);
        veterinario.setEmail(email);
        Veterinario veterinarioGuardado = repository.save(veterinario);

        Usuario usuario = new Usuario();
        usuario.setNombreUsuario(nombre);
        usuario.setEmail(email);
        usuario.setPasswordHash(passwordEncoder.encode(password));
        usuario.setRol(RolUsuario.veterinario);
        usuario.setActivo(true);
        usuario.setIdVeterinario(veterinarioGuardado.getIdVeterinario());

        try {
            usuarioRepository.save(usuario);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalStateException("No se pudo crear el usuario del veterinario");
        }

        return veterinarioGuardado;
    }

    @Override
    @Transactional
    public Veterinario save(Veterinario veterinario) {
        String email = normalizeEmail(veterinario.getEmail());
        if (isBlank(veterinario.getNombre()) || isBlank(veterinario.getEspecialidad())
                || isBlank(veterinario.getTelefono()) || isBlank(email)) {
            throw new IllegalArgumentException("Nombre, especialidad, telefono y email son obligatorios");
        }

        if (veterinario.getIdVeterinario() == null) {
            throw new IllegalArgumentException("Para crear un veterinario usa el modulo de administracion");
        }

        usuarioRepository.findByIdVeterinario(veterinario.getIdVeterinario()).ifPresent(usuario -> {
            if (!email.equalsIgnoreCase(usuario.getEmail()) && usuarioRepository.existsByEmailIgnoreCase(email)) {
                throw new IllegalStateException("Ya existe un usuario con ese email");
            }

            usuario.setEmail(email);
            usuario.setNombreUsuario(normalize(veterinario.getNombre()));
            usuarioRepository.save(usuario);
        });

        veterinario.setEmail(email);
        return repository.save(veterinario);
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        usuarioRepository.findByIdVeterinario(id).ifPresent(usuarioRepository::delete);
        repository.deleteById(id);
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
