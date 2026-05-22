package com.veterinaria.demo.controller;

import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.veterinaria.demo.dto.DocumentoMedicoRequest;
import com.veterinaria.demo.dto.DocumentoMedicoResponse;
import com.veterinaria.demo.service.DocumentoMedicoArchivoStorageService;
import com.veterinaria.demo.service.DocumentoMedicoService;

@RestController
@RequestMapping("/api/documentos-medicos")
@CrossOrigin(origins = "*")
public class DocumentoMedicoController {

    private final DocumentoMedicoService service;
    private final DocumentoMedicoArchivoStorageService archivoStorageService;

    public DocumentoMedicoController(
            DocumentoMedicoService service,
            DocumentoMedicoArchivoStorageService archivoStorageService) {
        this.service = service;
        this.archivoStorageService = archivoStorageService;
    }

    @GetMapping
    public List<DocumentoMedicoResponse> listar() {
        return service.findAll();
    }

    @GetMapping("/mascota/{idMascota}")
    public List<DocumentoMedicoResponse> listarPorMascota(@PathVariable Long idMascota) {
        return service.findByMascota(idMascota);
    }

    @GetMapping("/{id}")
    public DocumentoMedicoResponse obtener(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'VETERINARIO')")
    public DocumentoMedicoResponse crear(@RequestBody DocumentoMedicoRequest request) {
        return service.save(request);
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'VETERINARIO')")
    public DocumentoMedicoResponse subir(
            @RequestParam Long idMascota,
            @RequestParam(required = false) Long idConsulta,
            @RequestParam String tipo,
            @RequestParam String nombre,
            @RequestParam(required = false) String fecha,
            @RequestParam(required = false) String observaciones,
            @RequestParam("archivo") MultipartFile archivo) {

        DocumentoMedicoRequest request = new DocumentoMedicoRequest();
        request.setIdMascota(idMascota);
        request.setIdConsulta(idConsulta);
        request.setTipo(tipo);
        request.setNombre(nombre);
        request.setUrl("archivo pendiente");
        request.setFecha(fecha == null || fecha.isBlank() ? null : java.time.LocalDate.parse(fecha));
        request.setObservaciones(observaciones);

        DocumentoMedicoResponse creado = service.save(request);
        DocumentoMedicoArchivoStorageService.ArchivoGuardado guardado = archivoStorageService.guardar(archivo);
        String url = "/api/documentos-medicos/" + creado.getIdDocumento() + "/archivo";

        return service.updateArchivo(
                creado.getIdDocumento(),
                url,
                guardado.nombreArchivo(),
                guardado.mimeType(),
                guardado.tamanoBytes(),
                guardado.rutaStorage());
    }

    @GetMapping("/{id}/archivo")
    public ResponseEntity<Resource> descargarArchivo(@PathVariable Long id) {
        DocumentoMedicoResponse documento = service.findById(id);
        if (documento == null) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = archivoStorageService.cargar(documento.getRutaStorage());
        String nombreArchivo = documento.getNombreArchivo() != null ? documento.getNombreArchivo() : documento.getNombre();
        String mimeType = documento.getMimeType() != null ? documento.getMimeType() : MediaType.APPLICATION_OCTET_STREAM_VALUE;

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(mimeType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + nombreArchivo.replace("\"", "") + "\"")
                .body(resource);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'VETERINARIO')")
    public DocumentoMedicoResponse editar(@PathVariable Long id, @RequestBody DocumentoMedicoRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'VETERINARIO')")
    public void eliminar(@PathVariable Long id) {
        service.deleteById(id);
    }
}
