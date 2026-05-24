package com.veterinaria.demo.service;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.veterinaria.demo.dto.AuditoriaClinicaResponse;
import com.veterinaria.demo.model.Usuario;
import com.veterinaria.demo.security.CurrentUserService;

@Service
public class AuditoriaClinicaServiceImpl implements AuditoriaClinicaService {

    private final JdbcTemplate jdbcTemplate;
    private final CurrentUserService currentUserService;

    public AuditoriaClinicaServiceImpl(JdbcTemplate jdbcTemplate, CurrentUserService currentUserService) {
        this.jdbcTemplate = jdbcTemplate;
        this.currentUserService = currentUserService;
    }

    @Override
    public void registrar(String entidad, Long idEntidad, String accion, String resumen) {
        try {
            Usuario usuario = currentUserService.getAuthenticatedUsuario();
            jdbcTemplate.update("""
                    insert into auditoria_clinica (entidad, id_entidad, accion, id_usuario, rol_usuario, resumen)
                    values (?, ?, ?, ?, ?, ?)
                    """,
                    entidad,
                    idEntidad,
                    accion,
                    usuario.getIdUsuario(),
                    usuario.getRol().name(),
                    resumen);
        } catch (Exception ignored) {
            // La auditoría no debe impedir guardar datos clínicos si la tabla aún no existe.
        }
    }

    @Override
    public List<AuditoriaClinicaResponse> recientes() {
        return jdbcTemplate.query("""
                select id_auditoria, entidad, id_entidad, accion, id_usuario, rol_usuario, resumen, creado_en
                from auditoria_clinica
                order by creado_en desc
                limit 100
                """,
                (rs, rowNum) -> {
                    AuditoriaClinicaResponse response = new AuditoriaClinicaResponse();
                    response.setIdAuditoria(rs.getLong("id_auditoria"));
                    response.setEntidad(rs.getString("entidad"));
                    response.setIdEntidad(rs.getLong("id_entidad"));
                    response.setAccion(rs.getString("accion"));
                    response.setIdUsuario(rs.getLong("id_usuario"));
                    response.setRolUsuario(rs.getString("rol_usuario"));
                    response.setResumen(rs.getString("resumen"));
                    response.setCreadoEn(rs.getTimestamp("creado_en").toLocalDateTime());
                    return response;
                });
    }
}
