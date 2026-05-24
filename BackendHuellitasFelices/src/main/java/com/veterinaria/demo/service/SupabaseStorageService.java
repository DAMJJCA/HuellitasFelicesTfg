package com.veterinaria.demo.service;

import java.net.URI;
import java.util.Locale;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

@Service
public class SupabaseStorageService {

    private final boolean enabled;
    private final String supabaseUrl;
    private final String serviceRoleKey;
    private final String profileBucket;
    private final RestClient restClient;

    public SupabaseStorageService(
            @Value("${app.storage.supabase.enabled:false}") boolean enabled,
            @Value("${app.storage.supabase.url:}") String supabaseUrl,
            @Value("${app.storage.supabase.service-role-key:}") String serviceRoleKey,
            @Value("${app.storage.supabase.profile-bucket:profile-images}") String profileBucket) {
        this.enabled = enabled;
        this.supabaseUrl = supabaseUrl;
        this.serviceRoleKey = serviceRoleKey;
        this.profileBucket = profileBucket;
        this.restClient = RestClient.create();
    }

    public boolean isConfigured() {
        return enabled && !isBlank(supabaseUrl) && !isBlank(serviceRoleKey);
    }

    public String uploadProfileImage(Long idUsuario, MultipartFile file) {
        if (!isConfigured()) {
            throw new IllegalStateException("Supabase Storage no esta configurado");
        }
        validarImagen(file);

        try {
            String extension = extension(file.getOriginalFilename(), file.getContentType());
            String objectPath = "usuarios/" + idUsuario + "/" + UUID.randomUUID() + extension;
            String uploadUrl = normalizarUrl(supabaseUrl) + "/storage/v1/object/" + profileBucket + "/" + objectPath;

            restClient.post()
                    .uri(URI.create(uploadUrl))
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + serviceRoleKey)
                    .header("apikey", serviceRoleKey)
                    .contentType(MediaType.parseMediaType(file.getContentType()))
                    .body(file.getBytes())
                    .retrieve()
                    .toBodilessEntity();

            return normalizarUrl(supabaseUrl) + "/storage/v1/object/public/" + profileBucket + "/" + objectPath;
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo subir la imagen a Supabase Storage", ex);
        }
    }

    private void validarImagen(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Debes seleccionar una imagen");
        }
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!contentType.equals("image/jpeg") && !contentType.equals("image/png") && !contentType.equals("image/webp")) {
            throw new IllegalArgumentException("Solo se permiten imagenes JPG, PNG o WEBP");
        }
        if (file.getSize() > 2 * 1024 * 1024) {
            throw new IllegalArgumentException("La imagen no puede superar 2 MB");
        }
    }

    private String extension(String filename, String contentType) {
        if (filename != null) {
            int index = filename.lastIndexOf('.');
            if (index >= 0) {
                return filename.substring(index).toLowerCase(Locale.ROOT);
            }
        }
        return switch (contentType == null ? "" : contentType.toLowerCase(Locale.ROOT)) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
    }

    private String normalizarUrl(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
