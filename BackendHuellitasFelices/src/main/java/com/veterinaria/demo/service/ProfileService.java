package com.veterinaria.demo.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.veterinaria.demo.dto.ProfileResponse;
import com.veterinaria.demo.model.Usuario;
import com.veterinaria.demo.repository.UsuarioRepository;
import com.veterinaria.demo.security.CurrentUserService;

@Service
public class ProfileService {

    private static final int MAX_IMAGE_LENGTH = 1_400_000;

    private final CurrentUserService currentUserService;
    private final UsuarioRepository usuarioRepository;
    private final SupabaseStorageService supabaseStorageService;

    public ProfileService(
            CurrentUserService currentUserService,
            UsuarioRepository usuarioRepository,
            SupabaseStorageService supabaseStorageService) {
        this.currentUserService = currentUserService;
        this.usuarioRepository = usuarioRepository;
        this.supabaseStorageService = supabaseStorageService;
    }

    @Transactional
    public ProfileResponse uploadProfileImage(org.springframework.web.multipart.MultipartFile file) {
        Usuario usuario = currentUserService.getAuthenticatedUsuario();
        String publicUrl = supabaseStorageService.uploadProfileImage(usuario.getIdUsuario(), file);
        usuario.setFotoPerfilUrl(publicUrl);
        Usuario saved = usuarioRepository.save(usuario);
        return toResponse(saved);
    }

    public ProfileResponse getProfile() {
        return toResponse(currentUserService.getAuthenticatedUsuario());
    }

    @Transactional
    public ProfileResponse updateProfileImage(String profileImageUrl) {
        Usuario usuario = currentUserService.getAuthenticatedUsuario();
        usuario.setFotoPerfilUrl(validarImagen(profileImageUrl));
        Usuario saved = usuarioRepository.save(usuario);
        return toResponse(saved);
    }

    @Transactional
    public ProfileResponse clearProfileImage() {
        Usuario usuario = currentUserService.getAuthenticatedUsuario();
        usuario.setFotoPerfilUrl(null);
        Usuario saved = usuarioRepository.save(usuario);
        return toResponse(saved);
    }

    private String validarImagen(String profileImageUrl) {
        if (profileImageUrl == null || profileImageUrl.isBlank()) {
            return null;
        }

        String valor = profileImageUrl.trim();
        if (valor.length() > MAX_IMAGE_LENGTH) {
            throw new IllegalArgumentException("La imagen de perfil es demasiado grande");
        }
        if (!valor.startsWith("data:image/") && !valor.startsWith("https://") && !valor.startsWith("http://")) {
            throw new IllegalArgumentException("La imagen debe ser una URL valida o una imagen en base64");
        }
        return valor;
    }

    private ProfileResponse toResponse(Usuario usuario) {
        return new ProfileResponse(
                usuario.getEmail(),
                usuario.getNombreUsuario(),
                usuario.getRol().name(),
                usuario.getFotoPerfilUrl());
    }
}
