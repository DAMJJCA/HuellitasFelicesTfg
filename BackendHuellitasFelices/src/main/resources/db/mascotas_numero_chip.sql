alter table public.mascotas
    add column if not exists numero_chip varchar(50);

create unique index if not exists uk_mascotas_numero_chip
    on public.mascotas(lower(numero_chip))
    where numero_chip is not null and btrim(numero_chip) <> '';
