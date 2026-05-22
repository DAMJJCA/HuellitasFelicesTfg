create table if not exists public.cita_duraciones (
    id_cita bigint primary key references public.citas(id_cita) on delete cascade,
    duracion_minutos integer not null default 30 check (duracion_minutos in (15, 30, 45, 60))
);
