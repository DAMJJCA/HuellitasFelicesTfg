alter table public.mascotas
  add column if not exists foto_url text,
  add column if not exists alergias text,
  add column if not exists enfermedades_cronicas text,
  add column if not exists medicacion_habitual text,
  add column if not exists observaciones_internas text;
