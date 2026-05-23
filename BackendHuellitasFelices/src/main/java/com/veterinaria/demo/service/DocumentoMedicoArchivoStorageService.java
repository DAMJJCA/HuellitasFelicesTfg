package com.veterinaria.demo.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class DocumentoMedicoArchivoStorageService {

    private static final List<String> MIME_TYPES_PERMITIDOS = List.of(
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp");

    private final Path uploadDir;

    public DocumentoMedicoArchivoStorageService(@Value("${app.documents.upload-dir}") String uploadDir) {
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    public ArchivoGuardado guardar(MultipartFile archivo) {
        validarArchivo(archivo);

        try {
            Files.createDirectories(uploadDir);
            String nombreOriginal = limpiarNombre(archivo.getOriginalFilename());
            String extension = extension(nombreOriginal);
            String rutaRelativa = UUID.randomUUID() + extension;
            Path destino = uploadDir.resolve(rutaRelativa).normalize();

            if (!destino.startsWith(uploadDir)) {
                throw new IllegalArgumentException("Nombre de archivo no valido");
            }

            try (InputStream inputStream = archivo.getInputStream()) {
                Files.copy(inputStream, destino, StandardCopyOption.REPLACE_EXISTING);
            }

            return new ArchivoGuardado(
                    nombreOriginal,
                    normalizarMimeType(archivo.getContentType(), extension),
                    archivo.getSize(),
                    rutaRelativa);
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo guardar el archivo", e);
        }
    }

    public Resource cargar(String rutaStorage) {
        if (rutaStorage == null || rutaStorage.isBlank()) {
            throw new IllegalArgumentException("El documento no tiene archivo asociado");
        }

        try {
            Path archivo = uploadDir.resolve(rutaStorage).normalize();
            if (!archivo.startsWith(uploadDir) || !Files.exists(archivo)) {
                throw new IllegalArgumentException("No se encontro el archivo asociado");
            }
            Resource resource = new UrlResource(archivo.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new IllegalArgumentException("No se puede leer el archivo asociado");
            }
            return resource;
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo leer el archivo", e);
        }
    }

    public void eliminarSiExiste(String rutaStorage) {
        if (rutaStorage == null || rutaStorage.isBlank()) {
            return;
        }

        try {
            Path archivo = uploadDir.resolve(rutaStorage).normalize();
            if (!archivo.startsWith(uploadDir)) {
                return;
            }
            Files.deleteIfExists(archivo);
        } catch (IOException ignored) {
            // El registro clinico ya puede eliminarse aunque el archivo fisico no exista o no sea accesible.
        }
    }

    private void validarArchivo(MultipartFile archivo) {
        if (archivo == null || archivo.isEmpty()) {
            throw new IllegalArgumentException("Debes seleccionar un archivo");
        }

        String nombre = limpiarNombre(archivo.getOriginalFilename());
        String extension = extension(nombre);
        String mimeType = normalizarMimeType(archivo.getContentType(), extension);

        if (!MIME_TYPES_PERMITIDOS.contains(mimeType)) {
            throw new IllegalArgumentException("Solo se permiten archivos PDF, JPG, PNG o WEBP");
        }
    }

    private String limpiarNombre(String nombre) {
        if (nombre == null || nombre.isBlank()) {
            return "documento";
        }
        return Paths.get(nombre).getFileName().toString();
    }

    private String extension(String nombre) {
        int index = nombre.lastIndexOf('.');
        return index >= 0 ? nombre.substring(index).toLowerCase(Locale.ROOT) : "";
    }

    private String normalizarMimeType(String mimeType, String extension) {
        if (mimeType != null && !mimeType.isBlank() && !"application/octet-stream".equalsIgnoreCase(mimeType)) {
            return mimeType.toLowerCase(Locale.ROOT);
        }
        return switch (extension) {
            case ".pdf" -> "application/pdf";
            case ".jpg", ".jpeg" -> "image/jpeg";
            case ".png" -> "image/png";
            case ".webp" -> "image/webp";
            default -> "application/octet-stream";
        };
    }

    public record ArchivoGuardado(String nombreArchivo, String mimeType, Long tamanoBytes, String rutaStorage) {
    }
}
