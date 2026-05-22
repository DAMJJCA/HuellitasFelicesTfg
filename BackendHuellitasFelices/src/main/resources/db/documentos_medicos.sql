create table if not exists public.documentos_medicos (
    id_documento bigserial primary key,
    id_mascota bigint not null references public.mascotas(id_mascota) on delete cascade,
    id_consulta bigint null references public.consultas(id_consulta) on delete set null,
    tipo varchar(30) not null check (
        tipo in ('analitica', 'radiografia', 'informe', 'receta', 'consentimiento', 'foto', 'otro')
    ),
    nombre varchar(160) not null,
    url text not null,
    nombre_archivo varchar(255) null,
    mime_type varchar(120) null,
    tamano_bytes bigint null,
    ruta_storage text null,
    fecha date null,
    observaciones text null,
    creado_en timestamp without time zone not null default current_timestamp
);

alter table public.documentos_medicos
    add column if not exists nombre_archivo varchar(255),
    add column if not exists mime_type varchar(120),
    add column if not exists tamano_bytes bigint,
    add column if not exists ruta_storage text;

create index if not exists idx_documentos_medicos_mascota
    on public.documentos_medicos(id_mascota);

create index if not exists idx_documentos_medicos_consulta
    on public.documentos_medicos(id_consulta);

create index if not exists idx_documentos_medicos_fecha
    on public.documentos_medicos(fecha);
