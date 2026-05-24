# Produccion

## Variables recomendadas

- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- `JWT_SECRET`
- `REMINDERS_EMAIL_ENABLED=true` y variables `MAIL_*`
- `SUPABASE_STORAGE_ENABLED=true`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PROFILE_BUCKET=profile-images`
- `SUPABASE_DOCUMENTS_BUCKET=medical-documents`
- `NOTIFICATIONS_PROVIDER=log|email|whatsapp|sms`
- `STRIPE_SECRET_KEY` o credenciales del proveedor de pago si se activa cobro online

## Supabase Storage

Crear un bucket publico llamado `profile-images` o ajustar `SUPABASE_PROFILE_BUCKET`.
El backend sube imagenes a:

`profile-images/usuarios/{id_usuario}/{uuid}.{ext}`

Para documentos clinicos, el siguiente paso de produccion es mover los PDF/imagenes al bucket `medical-documents` y guardar en base de datos solo la URL/ruta segura, tamano, tipo MIME y fecha de subida. La app ya trabaja con metadatos de documento, por lo que el cambio importante es el adaptador de almacenamiento.

## Facturacion y pagos

La app tiene facturacion basica interna con estados `borrador`, `emitida`, `pagada` y `cancelada`.

Para pagos reales no conviene guardar tarjetas ni datos sensibles en la base de datos. La integracion recomendable seria:

- crear factura en Huellitas
- crear sesion de pago en Stripe/RedSys/PayPal desde backend
- redirigir al cliente al checkout del proveedor
- recibir webhook firmado
- marcar la factura como `pagada`

## Notificaciones

Email ya es el canal base. Para WhatsApp/SMS, la integracion deberia centralizarse en un proveedor como Twilio, WhatsApp Cloud API o similar:

- plantillas aprobadas por el proveedor
- consentimiento del cliente
- registro de envios y errores
- reintentos controlados

## Multiempresa

El SQL de producto incluye `clinicas` como primer paso. Para venderlo a varias clinicas, habria que ampliar las tablas principales con `id_clinica` y filtrar siempre por clinica activa:

- usuarios
- clientes
- mascotas
- veterinarios
- citas
- consultas
- facturas
- documentos

No conviene hacerlo a medias: es una frontera de seguridad de datos.

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
- comprobar permisos recepcion/auxiliar
- crear factura y marcarla como pagada

Comando recomendado cuando se instale:

```powershell
cd huellitas-frontend
npm install -D @playwright/test
npx playwright install
npx playwright test
```
