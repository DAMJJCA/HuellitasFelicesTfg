# Produccion

## Variables recomendadas

- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- `JWT_SECRET`
- `REMINDERS_EMAIL_ENABLED=true` y variables `MAIL_*`
- `SUPABASE_STORAGE_ENABLED=true`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PROFILE_BUCKET=profile-images`

## Supabase Storage

Crear un bucket publico llamado `profile-images` o ajustar `SUPABASE_PROFILE_BUCKET`.
El backend sube imagenes a:

`profile-images/usuarios/{id_usuario}/{uuid}.{ext}`

## Backups

Ejemplo:

```powershell
.\ops\backup_supabase.ps1 -DbUrl "postgresql://usuario:password@host:puerto/postgres"
```

## Docker

```powershell
docker compose up --build
```

Frontend: `http://localhost:4200`
Backend: `http://localhost:8080`

## E2E pendientes

Para tests E2E reales recomiendo Playwright cuando se pueda instalar dependencia:

- crear cita
- iniciar consulta
- finalizar consulta
- imprimir informe
- subir documento
- comprobar permisos cliente/veterinario/admin
