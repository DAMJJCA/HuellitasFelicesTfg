alter table public.citas
  add column if not exists eliminado boolean not null default false;

create index if not exists idx_citas_eliminado
  on public.citas(eliminado);
