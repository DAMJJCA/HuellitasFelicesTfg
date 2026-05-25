alter type public.rol_usuario add value if not exists 'recepcion';
alter type public.rol_usuario add value if not exists 'auxiliar';

create extension if not exists pgcrypto;

insert into public.usuarios (
  nombre_usuario,
  email,
  password_hash,
  rol,
  activo,
  creado_en,
  actualizado_en
)
values
  (
    'Recepcion Demo',
    'recepcion@huellitas.local',
    crypt('123456', gen_salt('bf')),
    'recepcion',
    true,
    current_timestamp,
    current_timestamp
  ),
  (
    'Auxiliar Demo',
    'auxiliar@huellitas.local',
    crypt('123456', gen_salt('bf')),
    'auxiliar',
    true,
    current_timestamp,
    current_timestamp
  )
on conflict (email) do update
set rol = excluded.rol,
    activo = true,
    actualizado_en = current_timestamp;
