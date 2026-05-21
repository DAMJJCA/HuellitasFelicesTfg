create table if not exists vacunas_desparasitaciones (
    id_registro bigserial primary key,
    id_mascota bigint not null references mascotas(id_mascota) on delete cascade,
    id_veterinario bigint null references veterinarios(id_veterinario) on delete set null,
    tipo varchar(30) not null check (tipo in ('vacuna', 'desparasitacion')),
    nombre varchar(120) not null,
    fecha_aplicacion date null,
    proxima_dosis date null,
    observaciones text null
);

create index if not exists idx_preventivos_mascota
    on vacunas_desparasitaciones(id_mascota);

create index if not exists idx_preventivos_proxima_dosis
    on vacunas_desparasitaciones(proxima_dosis);
