package com.veterinaria.demo.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

class DocumentoMedicoArchivoStorageServiceTest {

    @TempDir
    Path tempDir;

    @Test
    void guardaPdfYPermiteEliminarlo() throws Exception {
        DocumentoMedicoArchivoStorageService service = new DocumentoMedicoArchivoStorageService(tempDir.toString());
        MockMultipartFile archivo = new MockMultipartFile(
                "archivo",
                "informe.pdf",
                "application/pdf",
                "contenido".getBytes());

        DocumentoMedicoArchivoStorageService.ArchivoGuardado guardado = service.guardar(archivo);

        assertEquals("informe.pdf", guardado.nombreArchivo());
        assertEquals("application/pdf", guardado.mimeType());
        assertTrue(Files.exists(tempDir.resolve(guardado.rutaStorage())));

        service.eliminarSiExiste(guardado.rutaStorage());

        assertTrue(Files.notExists(tempDir.resolve(guardado.rutaStorage())));
    }

    @Test
    void rechazaArchivosNoPermitidos() {
        DocumentoMedicoArchivoStorageService service = new DocumentoMedicoArchivoStorageService(tempDir.toString());
        MockMultipartFile archivo = new MockMultipartFile(
                "archivo",
                "script.exe",
                "application/octet-stream",
                "contenido".getBytes());

        assertThrows(IllegalArgumentException.class, () -> service.guardar(archivo));
    }
}
