# Huellitas Felices

Sistema de gestion veterinaria con:

- `BackendHuellitasFelices`: API REST en Spring Boot
- `huellitas-frontend`: interfaz web en Angular

El proyecto permite gestionar clientes, mascotas, veterinarios, citas, consultas, tratamientos e historial medico, con autenticacion JWT y control de acceso por roles (`admin`, `cliente`, `veterinario`).

## Estructura

```text
HuellitasFelicesTfg/
├─ BackendHuellitasFelices/
└─ huellitas-frontend/
```

## Tecnologias

- Backend: Java 17, Spring Boot, Spring Security, Spring Data JPA, PostgreSQL, JWT
- Frontend: Angular 21, TypeScript, Tailwind/Flowbite
- Base de datos: PostgreSQL

## Requisitos

Antes de iniciar el proyecto, asegurate de tener instalado:

- Java 17
- Maven 3.9 o superior
- Node.js 20 o superior
- npm 11 o superior
- Visual Studio Code
- Extension recomendada en VS Code: `Extension Pack for Java`

## Configuracion del backend

El backend toma la conexion a base de datos desde variables de entorno, con valores por defecto definidos en:

[application.properties](/C:/HuellitasFelicesTfg/HuellitasFelicesTfg/BackendHuellitasFelices/src/main/resources/application.properties)

Variables usadas:

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_EXPIRATION_MS`

Si no defines variables de entorno, Spring intentara arrancar con los valores por defecto del archivo.

## Inicializar el backend en Visual Studio Code

1. Abre la carpeta del proyecto en VS Code:

```powershell
code C:\HuellitasFelicesTfg\HuellitasFelicesTfg
```

2. Abre una terminal nueva en VS Code.

3. Entra en la carpeta del backend:

```powershell
cd BackendHuellitasFelices
```

4. Arranca Spring Boot:

```powershell
mvn spring-boot:run
```

Si el proyecto incluye wrapper Maven y prefieres usarlo:

```powershell
.\mvnw.cmd spring-boot:run
```

5. Cuando arranque correctamente, el backend quedara disponible normalmente en:

```text
http://localhost:8080
```

## Inicializar el frontend en Visual Studio Code

1. Abre otra terminal nueva en VS Code.

2. Entra en la carpeta del frontend:

```powershell
cd huellitas-frontend
```

3. Instala dependencias la primera vez:

```powershell
npm install
```

4. Arranca Angular:

```powershell
npm start
```

5. Cuando compile correctamente, el frontend quedara disponible normalmente en:

```text
http://localhost:4200
```

## Flujo recomendado en VS Code

Usa dos terminales abiertas al mismo tiempo:

- Terminal 1:

```powershell
cd BackendHuellitasFelices
mvn spring-boot:run
```

- Terminal 2:

```powershell
cd huellitas-frontend
npm start
```

## Como detener los servicios

En cada terminal, presiona:

```text
Ctrl + C
```

## Scripts utiles del frontend

Desde `huellitas-frontend`:

```powershell
npm start
npm run build
npm test
```

## Endpoints y acceso

El backend expone la API bajo:

```text
http://localhost:8080/api
```

La autenticacion se realiza con JWT.

Roles principales:

- `admin`: acceso completo y gestion global
- `cliente`: acceso a sus mascotas, citas y datos relacionados
- `veterinario`: acceso a citas, consultas y tratamientos segun su ambito

## Registro y login

- Login: disponible desde la pantalla `/login`
- Registro de cliente: disponible desde `/registro`

El registro crea:

- un nuevo `cliente` en la tabla `clientes`
- un nuevo `usuario` en la tabla `usuarios` con rol `cliente`

## Problemas comunes

### El frontend no conecta con el backend

Comprueba:

- que el backend este arrancado en `http://localhost:8080`
- que el frontend este arrancado en `http://localhost:4200`
- que no haya errores de CORS o JWT en consola

### Error de base de datos al arrancar

Comprueba:

- conexion PostgreSQL
- credenciales correctas
- que el esquema de base de datos exista
- que los enums y tablas coincidan con el modelo JPA

### Cambios en backend no se reflejan

- deten el backend con `Ctrl + C`
- vuelve a arrancarlo con `mvn spring-boot:run`

## Notas

- `spring.jpa.hibernate.ddl-auto=validate` esta activo, por lo que Hibernate valida el esquema en vez de crearlo
- si cambias la base de datos manualmente, revisa que las entidades Java sigan coincidiendo con PostgreSQL
