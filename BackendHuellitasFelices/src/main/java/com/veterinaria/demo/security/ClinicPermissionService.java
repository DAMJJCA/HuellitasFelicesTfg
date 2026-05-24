package com.veterinaria.demo.security;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.veterinaria.demo.model.RolUsuario;

@Service
public class ClinicPermissionService {

    private static final Map<RolUsuario, Set<ClinicPermission>> MATRIX = new EnumMap<>(RolUsuario.class);

    static {
        MATRIX.put(RolUsuario.admin, EnumSet.allOf(ClinicPermission.class));
        MATRIX.put(RolUsuario.recepcion, EnumSet.of(
                ClinicPermission.MANAGE_CLIENTS,
                ClinicPermission.MANAGE_PETS,
                ClinicPermission.MANAGE_APPOINTMENTS,
                ClinicPermission.CHANGE_APPOINTMENT_STATUS,
                ClinicPermission.MANAGE_AVAILABILITY,
                ClinicPermission.VIEW_AUDIT,
                ClinicPermission.MANAGE_INVOICES,
                ClinicPermission.VIEW_DASHBOARD));
        MATRIX.put(RolUsuario.veterinario, EnumSet.of(
                ClinicPermission.CHANGE_APPOINTMENT_STATUS,
                ClinicPermission.MANAGE_CONSULTATIONS,
                ClinicPermission.MANAGE_TREATMENTS,
                ClinicPermission.MANAGE_DOCUMENTS,
                ClinicPermission.MANAGE_PREVENTIVES,
                ClinicPermission.VIEW_DASHBOARD));
        MATRIX.put(RolUsuario.auxiliar, EnumSet.of(
                ClinicPermission.MANAGE_DOCUMENTS,
                ClinicPermission.MANAGE_PREVENTIVES,
                ClinicPermission.VIEW_DASHBOARD));
        MATRIX.put(RolUsuario.cliente, EnumSet.of(
                ClinicPermission.MANAGE_APPOINTMENTS,
                ClinicPermission.VIEW_DASHBOARD));
    }

    public boolean has(RolUsuario role, ClinicPermission permission) {
        return MATRIX.getOrDefault(role, Set.of()).contains(permission);
    }

    public Set<ClinicPermission> permissionsFor(RolUsuario role) {
        return Set.copyOf(MATRIX.getOrDefault(role, Set.of()));
    }
}
