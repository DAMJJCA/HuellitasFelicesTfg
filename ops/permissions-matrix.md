# Matriz de permisos

La matriz fuente esta duplicada de forma explicita en:

- Backend: `BackendHuellitasFelices/src/main/java/com/veterinaria/demo/security/ClinicPermissionService.java`
- Frontend: `huellitas-frontend/src/app/core/permission.service.ts`

## Roles

| Permiso | Admin | Recepcion/Gerencia | Veterinario | Auxiliar | Cliente |
| --- | --- | --- | --- | --- | --- |
| Usuarios internos | Si | No | No | No | No |
| Clientes | Si | Si | No | No | No |
| Mascotas | Si | Si | No | No | Limitado |
| Citas | Si | Si | Estado clinico limitado | No | Sus citas |
| Consultas | Si | No | Si | No | No |
| Tratamientos | Si | No | Si | No | No |
| Documentos | Si | No | Si | Si | Lectura propia |
| Preventivos | Si | No | Si | Si | Lectura propia |
| Disponibilidad | Si | Si | Lectura propia | No | No |
| Auditoria | Si | Si | No | No | No |
| Facturacion | Si | Si | No | No | No |

Los guard del frontend solo mejoran experiencia de usuario. La decision final debe estar siempre reforzada por backend.
