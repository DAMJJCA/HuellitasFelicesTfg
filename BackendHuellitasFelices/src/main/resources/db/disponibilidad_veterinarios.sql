create table if not exists public.disponibilidad_veterinarios (
    id_disponibilidad bigserial primary key,
    id_veterinario bigint not null references public.veterinarios(id_veterinario) on delete cascade,
    dia_semana smallint not null check (dia_semana between 1 and 7),
    hora_inicio time without time zone not null,
    hora_fin time without time zone not null,
    activo boolean not null default true,
    creado_en timestamp without time zone not null default current_timestamp,
    constraint disponibilidad_horas_check check (hora_inicio < hora_fin)
);

create index if not exists idx_disponibilidad_veterinario_dia
    on public.disponibilidad_veterinarios(id_veterinario, dia_semana);
