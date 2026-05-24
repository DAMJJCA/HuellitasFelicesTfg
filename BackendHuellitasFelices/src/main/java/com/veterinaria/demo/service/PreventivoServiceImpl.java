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

import com.veterinaria.demo.dto.PreventivoRequest;
import com.veterinaria.demo.dto.PreventivoResponse;
import com.veterinaria.demo.repository.MascotaRepository;
import com.veterinaria.demo.security.CurrentUserService;

@Service
public class PreventivoServiceImpl implements PreventivoService {

    private static final List<String> TIPOS_PERMITIDOS = List.of("vacuna", "desparasitacion");

    private final JdbcTemplate jdbcTemplate;
    private final MascotaRepository mascotaRepository;
    private final CurrentUserService currentUserService;
    private final AuditoriaClinicaService auditoriaClinicaService;

    private final RowMapper<PreventivoResponse> rowMapper = (rs, rowNum) -> {
        PreventivoResponse response = new PreventivoResponse();
        response.setIdRegistro(rs.getLong("id_registro"));
        response.setIdMascota(rs.getLong("id_mascota"));
        response.setNombreMascota(rs.getString("nombre_mascota"));
        long idVeterinario = rs.getLong("id_veterinario");
        response.setIdVeterinario(rs.wasNull() ? null : idVeterinario);
        response.setNombreVeterinario(rs.getString("nombre_veterinario"));
        response.setTipo(rs.getString("tipo"));
        response.setNombre(rs.getString("nombre"));
        Date fechaAplicacion = rs.getDate("fecha_aplicacion");
        Date proximaDosis = rs.getDate("proxima_dosis");
        response.setFechaAplicacion(fechaAplicacion != null ? fechaAplicacion.toLocalDate() : null);
        response.setProximaDosis(proximaDosis != null ? proximaDosis.toLocalDate() : null);
        response.setObservaciones(rs.getString("observaciones"));
        return response;
    };

    public PreventivoServiceImpl(
            JdbcTemplate jdbcTemplate,
            MascotaRepository mascotaRepository,
            CurrentUserService currentUserService,
            AuditoriaClinicaService auditoriaClinicaService) {
        this.jdbcTemplate = jdbcTemplate;
        this.mascotaRepository = mascotaRepository;
        this.currentUserService = currentUserService;
        this.auditoriaClinicaService = auditoriaClinicaService;
    }

    @Override
    public List<PreventivoResponse> findAll() {
        if (currentUserService.isCliente()) {
            return jdbcTemplate.query(baseSql() + " where m.id_cliente = ? order by p.proxima_dosis nulls last, p.fecha_aplicacion desc",
                    rowMapper,
                    currentUserService.getAuthenticatedClienteIdOrThrow());
        }

        return jdbcTemplate.query(baseSql() + " order by p.proxima_dosis nulls last, p.fecha_aplicacion desc", rowMapper);
    }

    @Override
    public List<PreventivoResponse> findProximos() {
        LocalDate hasta = LocalDate.now().plusDays(30);
        String filtro = " where p.proxima_dosis is not null and p.proxima_dosis <= ?";

        if (currentUserService.isCliente()) {
            return jdbcTemplate.query(baseSql() + filtro + " and m.id_cliente = ? order by p.proxima_dosis",
                    rowMapper,
                    Date.valueOf(hasta),
                    currentUserService.getAuthenticatedClienteIdOrThrow());
        }

        return jdbcTemplate.query(baseSql() + filtro + " order by p.proxima_dosis", rowMapper, Date.valueOf(hasta));
    }

    @Override
    public PreventivoResponse findById(Long id) {
        List<PreventivoResponse> resultados;
        if (currentUserService.isCliente()) {
            resultados = jdbcTemplate.query(baseSql() + " where p.id_registro = ? and m.id_cliente = ?",
                    rowMapper,
                    id,
                    currentUserService.getAuthenticatedClienteIdOrThrow());
        } else {
            resultados = jdbcTemplate.query(baseSql() + " where p.id_registro = ?", rowMapper, id);
        }

        return resultados.isEmpty() ? null : resultados.get(0);
    }

    @Override
    @Transactional
    public PreventivoResponse save(PreventivoRequest request) {
        validarPuedeModificar(request);
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement("""
                    insert into vacunas_desparasitaciones
                    (id_mascota, id_veterinario, tipo, nombre, fecha_aplicacion, proxima_dosis, observaciones)
                    values (?, ?, ?, ?, ?, ?, ?)
                    """, new String[] { "id_registro" });
            rellenarStatement(ps, request);
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        Long id = key != null ? key.longValue() : null;
        auditoriaClinicaService.registrar("preventivo", id, "crear", "Preventivo " + request.getNombre());
        return findById(id);
    }

    @Override
    @Transactional
    public PreventivoResponse update(Long id, PreventivoRequest request) {
        validarPuedeModificar(request);
        if (findById(id) == null) {
            throw new IllegalArgumentException("El registro preventivo no existe");
        }

        jdbcTemplate.update("""
                update vacunas_desparasitaciones
                set id_mascota = ?, id_veterinario = ?, tipo = ?, nombre = ?,
                    fecha_aplicacion = ?, proxima_dosis = ?, observaciones = ?
                where id_registro = ?
                """,
                request.getIdMascota(),
                request.getIdVeterinario(),
                normalizarTipo(request.getTipo()),
                request.getNombre(),
                request.getFechaAplicacion(),
                request.getProximaDosis(),
                request.getObservaciones(),
                id);

        auditoriaClinicaService.registrar("preventivo", id, "editar", "Preventivo " + request.getNombre());
        return findById(id);
    }

    @Override
    public void deleteById(Long id) {
        if (currentUserService.isCliente()) {
            throw new AccessDeniedException("Los clientes no pueden eliminar vacunas o desparasitaciones");
        }
        jdbcTemplate.update("delete from vacunas_desparasitaciones where id_registro = ?", id);
        auditoriaClinicaService.registrar("preventivo", id, "eliminar", "Preventivo eliminado");
    }

    private String baseSql() {
        return """
                select p.id_registro, p.id_mascota, m.nombre as nombre_mascota,
                       p.id_veterinario, v.nombre as nombre_veterinario,
                       p.tipo, p.nombre, p.fecha_aplicacion, p.proxima_dosis, p.observaciones
                from vacunas_desparasitaciones p
                join mascotas m on m.id_mascota = p.id_mascota
                left join veterinarios v on v.id_veterinario = p.id_veterinario
                """;
    }

    private void validarPuedeModificar(PreventivoRequest request) {
        if (currentUserService.isCliente()) {
            throw new AccessDeniedException("Los clientes no pueden modificar vacunas o desparasitaciones");
        }
        if (request.getIdMascota() == null) {
            throw new IllegalArgumentException("Debes indicar la mascota");
        }
        if (!mascotaRepository.existsById(request.getIdMascota())) {
            throw new IllegalArgumentException("La mascota indicada no existe");
        }
        if (request.getNombre() == null || request.getNombre().isBlank()) {
            throw new IllegalArgumentException("Debes indicar el nombre");
        }
        if (request.getFechaAplicacion() == null && request.getProximaDosis() == null) {
            throw new IllegalArgumentException("Debes indicar la fecha de aplicacion o la proxima dosis");
        }
        if (request.getFechaAplicacion() != null
                && request.getProximaDosis() != null
                && request.getProximaDosis().isBefore(request.getFechaAplicacion())) {
            throw new IllegalArgumentException("La proxima dosis no puede ser anterior a la fecha de aplicacion");
        }
        normalizarTipo(request.getTipo());
    }

    private void rellenarStatement(PreparedStatement ps, PreventivoRequest request) throws java.sql.SQLException {
        ps.setLong(1, request.getIdMascota());
        if (request.getIdVeterinario() != null) {
            ps.setLong(2, request.getIdVeterinario());
        } else {
            ps.setObject(2, null);
        }
        ps.setString(3, normalizarTipo(request.getTipo()));
        ps.setString(4, request.getNombre());
        ps.setObject(5, request.getFechaAplicacion());
        ps.setObject(6, request.getProximaDosis());
        ps.setString(7, request.getObservaciones());
    }

    private String normalizarTipo(String tipo) {
        if (tipo == null || tipo.isBlank()) {
            throw new IllegalArgumentException("Debes indicar el tipo");
        }
        String tipoNormalizado = tipo.trim().toLowerCase(Locale.ROOT).replace(' ', '_');
        if (!TIPOS_PERMITIDOS.contains(tipoNormalizado)) {
            throw new IllegalArgumentException("Tipo preventivo no valido: " + tipo);
        }
        return tipoNormalizado;
    }
}
