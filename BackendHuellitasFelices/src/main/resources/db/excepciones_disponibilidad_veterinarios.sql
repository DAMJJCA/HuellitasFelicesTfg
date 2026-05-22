create table if not exists public.disponibilidad_veterinarios_excepciones (
    id_excepcion bigserial primary key,
    id_veterinario bigint not null references public.veterinarios(id_veterinario) on delete cascade,
    fecha date not null,
    tipo varchar(20) not null check (tipo in ('disponible', 'no_disponible')),
    hora_inicio time without time zone null,
    hora_fin time without time zone null,
    motivo varchar(180) null,
    activo boolean not null default true,
    creado_en timestamp without time zone not null default current_timestamp,
    constraint excepcion_disponible_horas_check check (
        (tipo = 'no_disponible' and hora_inicio is null and hora_fin is null)
        or
        (tipo = 'disponible' and hora_inicio is not null and hora_fin is not null and hora_inicio < hora_fin)
    )
);

create index if not exists idx_excepciones_disponibilidad_veterinario_fecha
    on public.disponibilidad_veterinarios_excepciones(id_veterinario, fecha);
