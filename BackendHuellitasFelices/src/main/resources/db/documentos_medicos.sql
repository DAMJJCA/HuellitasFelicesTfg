create table if not exists public.documentos_medicos (
    id_documento bigserial primary key,
    id_mascota bigint not null references public.mascotas(id_mascota) on delete cascade,
    id_consulta bigint null references public.consultas(id_consulta) on delete set null,
    tipo varchar(30) not null check (
        tipo in ('analitica', 'radiografia', 'informe', 'receta', 'consentimiento', 'foto', 'otro')
    ),
    nombre varchar(160) not null,
    url text not null,
    fecha date null,
    observaciones text null,
    creado_en timestamp without time zone not null default current_timestamp
);

create index if not exists idx_documentos_medicos_mascota
    on public.documentos_medicos(id_mascota);

create index if not exists idx_documentos_medicos_consulta
    on public.documentos_medicos(id_consulta);

create index if not exists idx_documentos_medicos_fecha
    on public.documentos_medicos(fecha);
