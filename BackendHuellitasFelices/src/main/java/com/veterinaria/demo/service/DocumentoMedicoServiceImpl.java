package com.veterinaria.demo.service;

import java.sql.Date;
import java.sql.PreparedStatement;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.veterinaria.demo.dto.DocumentoMedicoRequest;
import com.veterinaria.demo.dto.DocumentoMedicoResponse;
import com.veterinaria.demo.repository.MascotaRepository;
import com.veterinaria.demo.security.CurrentUserService;

@Service
public class DocumentoMedicoServiceImpl implements DocumentoMedicoService {

    private static final List<String> TIPOS_PERMITIDOS = List.of(
            "analitica",
            "radiografia",
            "informe",
            "receta",
            "consentimiento",
            "foto",
            "otro");

    private final JdbcTemplate jdbcTemplate;
    private final MascotaRepository mascotaRepository;
    private final CurrentUserService currentUserService;
    private final DocumentoMedicoArchivoStorageService archivoStorageService;

    private final RowMapper<DocumentoMedicoResponse> rowMapper = (rs, rowNum) -> {
        DocumentoMedicoResponse response = new DocumentoMedicoResponse();
        response.setIdDocumento(rs.getLong("id_documento"));
        response.setIdMascota(rs.getLong("id_mascota"));
        response.setNombreMascota(rs.getString("nombre_mascota"));
        long idConsulta = rs.getLong("id_consulta");
        response.setIdConsulta(rs.wasNull() ? null : idConsulta);
        response.setTipo(rs.getString("tipo"));
        response.setNombre(rs.getString("nombre"));
        response.setUrl(rs.getString("url"));
        response.setNombreArchivo(rs.getString("nombre_archivo"));
        response.setMimeType(rs.getString("mime_type"));
        long tamanoBytes = rs.getLong("tamano_bytes");
        response.setTamanoBytes(rs.wasNull() ? null : tamanoBytes);
        response.setRutaStorage(rs.getString("ruta_storage"));
        Date fecha = rs.getDate("fecha");
        response.setFecha(fecha != null ? fecha.toLocalDate() : null);
        response.setObservaciones(rs.getString("observaciones"));
        return response;
    };

    public DocumentoMedicoServiceImpl(
            JdbcTemplate jdbcTemplate,
            MascotaRepository mascotaRepository,
            CurrentUserService currentUserService,
            DocumentoMedicoArchivoStorageService archivoStorageService) {
        this.jdbcTemplate = jdbcTemplate;
        this.mascotaRepository = mascotaRepository;
        this.currentUserService = currentUserService;
        this.archivoStorageService = archivoStorageService;
    }

    @Override
    public List<DocumentoMedicoResponse> findAll() {
        if (currentUserService.isCliente()) {
            return jdbcTemplate.query(baseSql() + " where m.id_cliente = ? order by d.fecha desc nulls last, d.id_documento desc",
                    rowMapper,
                    currentUserService.getAuthenticatedClienteIdOrThrow());
        }
        return jdbcTemplate.query(baseSql() + " order by d.fecha desc nulls last, d.id_documento desc", rowMapper);
    }

    @Override
    public List<DocumentoMedicoResponse> findByMascota(Long idMascota) {
        validarAccesoMascota(idMascota);
        return jdbcTemplate.query(baseSql() + " where d.id_mascota = ? order by d.fecha desc nulls last, d.id_documento desc",
                rowMapper,
                idMascota);
    }

    @Override
    public DocumentoMedicoResponse findById(Long id) {
        List<DocumentoMedicoResponse> resultados;
        if (currentUserService.isCliente()) {
            resultados = jdbcTemplate.query(baseSql() + " where d.id_documento = ? and m.id_cliente = ?",
                    rowMapper,
                    id,
                    currentUserService.getAuthenticatedClienteIdOrThrow());
        } else {
            resultados = jdbcTemplate.query(baseSql() + " where d.id_documento = ?", rowMapper, id);
        }
        return resultados.isEmpty() ? null : resultados.get(0);
    }

    @Override
    @Transactional
    public DocumentoMedicoResponse save(DocumentoMedicoRequest request) {
        validarPuedeModificar(request);
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement("""
                    insert into documentos_medicos
                    (id_mascota, id_consulta, tipo, nombre, url, nombre_archivo, mime_type, tamano_bytes, ruta_storage, fecha, observaciones)
                    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, new String[] { "id_documento" });
            rellenarStatement(ps, request);
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        return findById(key != null ? key.longValue() : null);
    }

    @Override
    @Transactional
    public DocumentoMedicoResponse update(Long id, DocumentoMedicoRequest request) {
        validarPuedeModificar(request);
        if (findById(id) == null) {
            throw new IllegalArgumentException("El documento medico no existe");
        }

        jdbcTemplate.update("""
                update documentos_medicos
                set id_mascota = ?, id_consulta = ?, tipo = ?, nombre = ?, url = ?,
                    nombre_archivo = ?, mime_type = ?, tamano_bytes = ?, ruta_storage = ?,
                    fecha = ?, observaciones = ?
                where id_documento = ?
                """,
                request.getIdMascota(),
                request.getIdConsulta(),
                normalizarTipo(request.getTipo()),
                request.getNombre(),
                request.getUrl(),
                request.getNombreArchivo(),
                request.getMimeType(),
                request.getTamanoBytes(),
                request.getRutaStorage(),
                request.getFecha(),
                request.getObservaciones(),
                id);

        return findById(id);
    }

    @Override
    @Transactional
    public DocumentoMedicoResponse updateArchivo(Long id, String url, String nombreArchivo, String mimeType, Long tamanoBytes, String rutaStorage) {
        DocumentoMedicoResponse actual = findById(id);
        if (actual == null) {
            throw new IllegalArgumentException("El documento medico no existe");
        }
        if (currentUserService.isCliente()) {
            throw new AccessDeniedException("Los clientes no pueden modificar documentos medicos");
        }

        jdbcTemplate.update("""
                update documentos_medicos
                set url = ?, nombre_archivo = ?, mime_type = ?, tamano_bytes = ?, ruta_storage = ?
                where id_documento = ?
                """,
                url,
                nombreArchivo,
                mimeType,
                tamanoBytes,
                rutaStorage,
                id);

        return findById(id);
    }

    @Override
    public void deleteById(Long id) {
        if (currentUserService.isCliente()) {
            throw new AccessDeniedException("Los clientes no pueden eliminar documentos medicos");
        }
        DocumentoMedicoResponse documento = findById(id);
        jdbcTemplate.update("delete from documentos_medicos where id_documento = ?", id);
        if (documento != null) {
            archivoStorageService.eliminarSiExiste(documento.getRutaStorage());
        }
    }

    private String baseSql() {
        return """
                select d.id_documento, d.id_mascota, m.nombre as nombre_mascota,
                       d.id_consulta, d.tipo, d.nombre, d.url, d.nombre_archivo, d.mime_type,
                       d.tamano_bytes, d.ruta_storage, d.fecha, d.observaciones
                from documentos_medicos d
                join mascotas m on m.id_mascota = d.id_mascota
                """;
    }

    private void validarPuedeModificar(DocumentoMedicoRequest request) {
        if (currentUserService.isCliente()) {
            throw new AccessDeniedException("Los clientes no pueden modificar documentos medicos");
        }
        if (request.getIdMascota() == null) {
            throw new IllegalArgumentException("Debes indicar la mascota");
        }
        if (!mascotaRepository.existsById(request.getIdMascota())) {
            throw new IllegalArgumentException("La mascota indicada no existe");
        }
        if (request.getNombre() == null || request.getNombre().isBlank()) {
            throw new IllegalArgumentException("Debes indicar el nombre del documento");
        }
        if (request.getUrl() == null || request.getUrl().isBlank()) {
            throw new IllegalArgumentException("Debes indicar la URL del documento");
        }
        if (request.getIdConsulta() != null && !consultaPerteneceAMascota(request.getIdConsulta(), request.getIdMascota())) {
            throw new IllegalArgumentException("La consulta indicada no pertenece a la mascota seleccionada");
        }
        if (request.getFecha() != null && request.getFecha().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("La fecha del documento no puede ser futura");
        }
        normalizarTipo(request.getTipo());
    }

    private void validarAccesoMascota(Long idMascota) {
        if (idMascota == null) {
            throw new IllegalArgumentException("Debes indicar la mascota");
        }
        if (currentUserService.isCliente()
                && !mascotaRepository.existsByIdMascotaAndCliente_IdCliente(idMascota, currentUserService.getAuthenticatedClienteIdOrThrow())) {
            throw new AccessDeniedException("No tienes acceso a los documentos de esta mascota");
        }
    }

    private void rellenarStatement(PreparedStatement ps, DocumentoMedicoRequest request) throws java.sql.SQLException {
        ps.setLong(1, request.getIdMascota());
        if (request.getIdConsulta() != null) {
            ps.setLong(2, request.getIdConsulta());
        } else {
            ps.setObject(2, null);
        }
        ps.setString(3, normalizarTipo(request.getTipo()));
        ps.setString(4, request.getNombre());
        ps.setString(5, request.getUrl());
        ps.setString(6, request.getNombreArchivo());
        ps.setString(7, request.getMimeType());
        ps.setObject(8, request.getTamanoBytes());
        ps.setString(9, request.getRutaStorage());
        ps.setObject(10, request.getFecha());
        ps.setString(11, request.getObservaciones());
    }

    private boolean consultaPerteneceAMascota(Long idConsulta, Long idMascota) {
        Integer total = jdbcTemplate.queryForObject("""
                select count(*)
                from consultas co
                join citas ci on ci.id_cita = co.id_cita
                where co.id_consulta = ? and ci.id_mascota = ?
                """, Integer.class, idConsulta, idMascota);
        return total != null && total > 0;
    }

    private String normalizarTipo(String tipo) {
        if (tipo == null || tipo.isBlank()) {
            throw new IllegalArgumentException("Debes indicar el tipo de documento");
        }
        String tipoNormalizado = tipo.trim().toLowerCase(Locale.ROOT).replace(' ', '_');
        if (!TIPOS_PERMITIDOS.contains(tipoNormalizado)) {
            throw new IllegalArgumentException("Tipo de documento no valido: " + tipo);
        }
        return tipoNormalizado;
    }
}
