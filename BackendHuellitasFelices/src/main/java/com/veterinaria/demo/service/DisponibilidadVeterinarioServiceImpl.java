package com.veterinaria.demo.service;

import java.sql.PreparedStatement;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Locale;

import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.veterinaria.demo.dto.DisponibilidadVeterinarioRequest;
import com.veterinaria.demo.dto.DisponibilidadVeterinarioResponse;
import com.veterinaria.demo.dto.ExcepcionDisponibilidadRequest;
import com.veterinaria.demo.dto.ExcepcionDisponibilidadResponse;
import com.veterinaria.demo.repository.VeterinarioRepository;
import com.veterinaria.demo.security.CurrentUserService;

@Service
public class DisponibilidadVeterinarioServiceImpl implements DisponibilidadVeterinarioService {

    private final JdbcTemplate jdbcTemplate;
    private final VeterinarioRepository veterinarioRepository;
    private final CurrentUserService currentUserService;

    private final RowMapper<DisponibilidadVeterinarioResponse> mapper = (rs, rowNum) -> {
        DisponibilidadVeterinarioResponse response = new DisponibilidadVeterinarioResponse();
        response.setIdDisponibilidad(rs.getLong("id_disponibilidad"));
        response.setIdVeterinario(rs.getLong("id_veterinario"));
        response.setNombreVeterinario(rs.getString("nombre_veterinario"));
        response.setDiaSemana(rs.getInt("dia_semana"));
        response.setHoraInicio(rs.getString("hora_inicio").substring(0, 5));
        response.setHoraFin(rs.getString("hora_fin").substring(0, 5));
        response.setActivo(rs.getBoolean("activo"));
        return response;
    };

    private final RowMapper<ExcepcionDisponibilidadResponse> excepcionMapper = (rs, rowNum) -> {
        ExcepcionDisponibilidadResponse response = new ExcepcionDisponibilidadResponse();
        response.setIdExcepcion(rs.getLong("id_excepcion"));
        response.setIdVeterinario(rs.getLong("id_veterinario"));
        response.setNombreVeterinario(rs.getString("nombre_veterinario"));
        response.setFecha(rs.getDate("fecha").toLocalDate());
        response.setTipo(rs.getString("tipo"));
        response.setHoraInicio(rs.getString("hora_inicio") == null ? null : rs.getString("hora_inicio").substring(0, 5));
        response.setHoraFin(rs.getString("hora_fin") == null ? null : rs.getString("hora_fin").substring(0, 5));
        response.setMotivo(rs.getString("motivo"));
        response.setActivo(rs.getBoolean("activo"));
        return response;
    };

    public DisponibilidadVeterinarioServiceImpl(
            JdbcTemplate jdbcTemplate,
            VeterinarioRepository veterinarioRepository,
            CurrentUserService currentUserService) {
        this.jdbcTemplate = jdbcTemplate;
        this.veterinarioRepository = veterinarioRepository;
        this.currentUserService = currentUserService;
    }

    @Override
    public List<DisponibilidadVeterinarioResponse> findAll() {
        if (currentUserService.isVeterinario()) {
            return findByVeterinario(currentUserService.getAuthenticatedVeterinarioIdOrThrow());
        }

        return jdbcTemplate.query(baseSql() + " order by v.nombre, d.dia_semana, d.hora_inicio", mapper);
    }

    @Override
    public List<DisponibilidadVeterinarioResponse> findByVeterinario(Long idVeterinario) {
        if (currentUserService.isVeterinario()
                && !currentUserService.getAuthenticatedVeterinarioIdOrThrow().equals(idVeterinario)) {
            throw new AccessDeniedException("No puedes consultar la disponibilidad de otro veterinario");
        }

        return jdbcTemplate.query(
                baseSql() + " where d.id_veterinario = ? order by d.dia_semana, d.hora_inicio",
                mapper,
                idVeterinario);
    }

    @Override
    public DisponibilidadVeterinarioResponse save(DisponibilidadVeterinarioRequest request) {
        validarRequest(request);

        String sql = """
                insert into disponibilidad_veterinarios
                    (id_veterinario, dia_semana, hora_inicio, hora_fin, activo)
                values (?, ?, cast(? as time), cast(? as time), ?)
                """;

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, new String[] { "id_disponibilidad" });
            ps.setLong(1, request.getIdVeterinario());
            ps.setInt(2, request.getDiaSemana());
            ps.setString(3, request.getHoraInicio());
            ps.setString(4, request.getHoraFin());
            ps.setBoolean(5, request.getActivo() == null || request.getActivo());
            return ps;
        }, keyHolder);

        return findById(keyHolder.getKey().longValue());
    }

    @Override
    public DisponibilidadVeterinarioResponse update(Long id, DisponibilidadVeterinarioRequest request) {
        validarRequest(request);

        int updated = jdbcTemplate.update("""
                update disponibilidad_veterinarios
                set id_veterinario = ?, dia_semana = ?, hora_inicio = cast(? as time), hora_fin = cast(? as time), activo = ?
                where id_disponibilidad = ?
                """,
                request.getIdVeterinario(),
                request.getDiaSemana(),
                request.getHoraInicio(),
                request.getHoraFin(),
                request.getActivo() == null || request.getActivo(),
                id);

        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "La disponibilidad no existe");
        }

        return findById(id);
    }

    @Override
    public void delete(Long id) {
        jdbcTemplate.update("delete from disponibilidad_veterinarios where id_disponibilidad = ?", id);
    }

    @Override
    public List<ExcepcionDisponibilidadResponse> findAllExcepciones() {
        if (currentUserService.isVeterinario()) {
            return findExcepcionesByVeterinario(currentUserService.getAuthenticatedVeterinarioIdOrThrow());
        }

        return jdbcTemplate.query(baseExcepcionSql() + " order by e.fecha desc, v.nombre, e.hora_inicio", excepcionMapper);
    }

    @Override
    public List<ExcepcionDisponibilidadResponse> findExcepcionesByVeterinario(Long idVeterinario) {
        if (currentUserService.isVeterinario()
                && !currentUserService.getAuthenticatedVeterinarioIdOrThrow().equals(idVeterinario)) {
            throw new AccessDeniedException("No puedes consultar excepciones de otro veterinario");
        }

        return jdbcTemplate.query(
                baseExcepcionSql() + " where e.id_veterinario = ? order by e.fecha desc, e.hora_inicio",
                excepcionMapper,
                idVeterinario);
    }

    @Override
    public ExcepcionDisponibilidadResponse saveExcepcion(ExcepcionDisponibilidadRequest request) {
        validarExcepcionRequest(request);

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement("""
                    insert into disponibilidad_veterinarios_excepciones
                        (id_veterinario, fecha, tipo, hora_inicio, hora_fin, motivo, activo)
                    values (?, ?, ?, cast(? as time), cast(? as time), ?, ?)
                    """, new String[] { "id_excepcion" });
            ps.setLong(1, request.getIdVeterinario());
            ps.setObject(2, request.getFecha());
            ps.setString(3, normalizarTipoExcepcion(request.getTipo()));
            ps.setString(4, request.getHoraInicio());
            ps.setString(5, request.getHoraFin());
            ps.setString(6, request.getMotivo());
            ps.setBoolean(7, request.getActivo() == null || request.getActivo());
            return ps;
        }, keyHolder);

        return findExcepcionById(keyHolder.getKey().longValue());
    }

    @Override
    public ExcepcionDisponibilidadResponse updateExcepcion(Long id, ExcepcionDisponibilidadRequest request) {
        validarExcepcionRequest(request);

        int updated = jdbcTemplate.update("""
                update disponibilidad_veterinarios_excepciones
                set id_veterinario = ?, fecha = ?, tipo = ?, hora_inicio = cast(? as time), hora_fin = cast(? as time), motivo = ?, activo = ?
                where id_excepcion = ?
                """,
                request.getIdVeterinario(),
                request.getFecha(),
                normalizarTipoExcepcion(request.getTipo()),
                request.getHoraInicio(),
                request.getHoraFin(),
                request.getMotivo(),
                request.getActivo() == null || request.getActivo(),
                id);

        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "La excepcion no existe");
        }

        return findExcepcionById(id);
    }

    @Override
    public void deleteExcepcion(Long id) {
        jdbcTemplate.update("delete from disponibilidad_veterinarios_excepciones where id_excepcion = ?", id);
    }

    @Override
    public boolean estaDisponible(Long idVeterinario, LocalDate fecha, String hora) {
        if (idVeterinario == null || fecha == null || hora == null || hora.isBlank()) {
            return true;
        }

        try {
            List<ExcepcionDisponibilidadResponse> excepciones = jdbcTemplate.query(
                    baseExcepcionSql() + " where e.id_veterinario = ? and e.fecha = ? and e.activo = true order by e.hora_inicio",
                    excepcionMapper,
                    idVeterinario,
                    fecha);

            if (!excepciones.isEmpty()) {
                return excepciones.stream()
                        .filter(excepcion -> "disponible".equals(excepcion.getTipo()))
                        .anyMatch(excepcion -> horaDentroDeTramo(hora, excepcion.getHoraInicio(), excepcion.getHoraFin()));
            }

            int diaSemana = fecha.getDayOfWeek().getValue();
            Integer reglasDia = jdbcTemplate.queryForObject("""
                    select count(*)
                    from disponibilidad_veterinarios
                    where id_veterinario = ? and dia_semana = ? and activo = true
                    """, Integer.class, idVeterinario, diaSemana);

            if (reglasDia == null || reglasDia == 0) {
                return true;
            }

            Integer reglasValidas = jdbcTemplate.queryForObject("""
                    select count(*)
                    from disponibilidad_veterinarios
                    where id_veterinario = ?
                      and dia_semana = ?
                      and activo = true
                      and cast(? as time) >= hora_inicio
                      and cast(? as time) < hora_fin
                    """, Integer.class, idVeterinario, diaSemana, hora, hora);

            return reglasValidas != null && reglasValidas > 0;
        } catch (DataAccessException ex) {
            return true;
        }
    }

    private DisponibilidadVeterinarioResponse findById(Long id) {
        return jdbcTemplate.query(
                        baseSql() + " where d.id_disponibilidad = ?",
                        mapper,
                        id)
                .stream()
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "La disponibilidad no existe"));
    }

    private void validarRequest(DisponibilidadVeterinarioRequest request) {
        if (request.getIdVeterinario() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debes indicar el veterinario");
        }
        if (!veterinarioRepository.existsById(request.getIdVeterinario())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El veterinario no existe");
        }
        if (request.getDiaSemana() == null || request.getDiaSemana() < 1 || request.getDiaSemana() > 7) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El dia de la semana debe estar entre 1 y 7");
        }

        LocalTime inicio;
        LocalTime fin;
        try {
            inicio = LocalTime.parse(request.getHoraInicio());
            fin = LocalTime.parse(request.getHoraFin());
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Las horas deben tener formato HH:mm");
        }

        if (!inicio.isBefore(fin)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La hora de inicio debe ser anterior a la hora de fin");
        }
    }

    private ExcepcionDisponibilidadResponse findExcepcionById(Long id) {
        return jdbcTemplate.query(
                        baseExcepcionSql() + " where e.id_excepcion = ?",
                        excepcionMapper,
                        id)
                .stream()
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "La excepcion no existe"));
    }

    private void validarExcepcionRequest(ExcepcionDisponibilidadRequest request) {
        if (request.getIdVeterinario() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debes indicar el veterinario");
        }
        if (!veterinarioRepository.existsById(request.getIdVeterinario())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El veterinario no existe");
        }
        if (request.getFecha() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debes indicar la fecha");
        }

        String tipo = normalizarTipoExcepcion(request.getTipo());
        if ("no_disponible".equals(tipo)) {
            request.setHoraInicio(null);
            request.setHoraFin(null);
            return;
        }

        LocalTime inicio;
        LocalTime fin;
        try {
            inicio = LocalTime.parse(request.getHoraInicio());
            fin = LocalTime.parse(request.getHoraFin());
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Las horas deben tener formato HH:mm");
        }

        if (!inicio.isBefore(fin)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La hora de inicio debe ser anterior a la hora de fin");
        }
    }

    private String normalizarTipoExcepcion(String tipo) {
        if (tipo == null || tipo.isBlank()) {
            return "no_disponible";
        }

        String normalizado = tipo.trim().toLowerCase(Locale.ROOT).replace('-', '_').replace(' ', '_');
        if (!List.of("disponible", "no_disponible").contains(normalizado)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de excepcion no valido");
        }
        return normalizado;
    }

    private boolean horaDentroDeTramo(String hora, String inicio, String fin) {
        if (hora == null || inicio == null || fin == null) {
            return false;
        }
        LocalTime horaCita = LocalTime.parse(hora.substring(0, 5));
        return !horaCita.isBefore(LocalTime.parse(inicio)) && horaCita.isBefore(LocalTime.parse(fin));
    }

    private String baseSql() {
        return """
                select d.id_disponibilidad,
                       d.id_veterinario,
                       v.nombre as nombre_veterinario,
                       d.dia_semana,
                       d.hora_inicio::text as hora_inicio,
                       d.hora_fin::text as hora_fin,
                       d.activo
                from disponibilidad_veterinarios d
                join veterinarios v on v.id_veterinario = d.id_veterinario
                """;
    }

    private String baseExcepcionSql() {
        return """
                select e.id_excepcion,
                       e.id_veterinario,
                       v.nombre as nombre_veterinario,
                       e.fecha,
                       e.tipo,
                       e.hora_inicio::text as hora_inicio,
                       e.hora_fin::text as hora_fin,
                       e.motivo,
                       e.activo
                from disponibilidad_veterinarios_excepciones e
                join veterinarios v on v.id_veterinario = e.id_veterinario
                """;
    }
}
