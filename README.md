# API Laboral — Backend

REST API desarrollada con **NestJS** para la gestión de nóminas, distribuciones de costes por proyecto y auditoría de operaciones en entornos laborales. Diseñada para integrarse con un frontend Next.js y desplegable mediante Docker Compose.

---

## Tabla de contenidos

- [Descripción general](#descripción-general)
- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura y módulos](#arquitectura-y-módulos)
- [Modelo de datos](#modelo-de-datos)
- [Endpoints de la API](#endpoints-de-la-api)
- [Autenticación y roles](#autenticación-y-roles)
- [Sistema de auditoría](#sistema-de-auditoría)
- [Importación desde Excel](#importación-desde-excel)
- [Motor de cálculo](#motor-de-cálculo)
- [Instalación y puesta en marcha](#instalación-y-puesta-en-marcha)
- [Variables de entorno](#variables-de-entorno)
- [Documentación Swagger](#documentación-swagger)
- [Scripts disponibles](#scripts-disponibles)

---

## Descripción general

Esta API gestiona la **distribución de costes salariales de empleados entre proyectos** a lo largo del tiempo. Permite:

- Registrar **perfiles de empleados** y sus datos de nómina (devengado, aportación, horas) por períodos.
- Definir **proyectos** y asignar a cada empleado un porcentaje de dedicación por fecha.
- **Calcular automáticamente** cuánto coste corresponde a cada proyecto por empleado y mes, cruzando los datos de distribución (%) con los datos de nómina reales o estimados.
- Importar datos masivos de nóminas mediante **archivos Excel**.
- Registrar un **log de auditoría** de todas las acciones de creación, modificación y eliminación.
- Gestionar usuarios con dos roles diferenciados: **Admin** y **Employee**.

---

## Stack tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| [NestJS](https://nestjs.com/) | v11 | Framework principal (Node.js) |
| [TypeORM](https://typeorm.io/) | v0.3 | ORM y gestión de base de datos |
| [PostgreSQL](https://www.postgresql.org/) | v16 | Base de datos relacional |
| [JWT / Passport](https://docs.nestjs.com/security/authentication) | — | Autenticación stateless |
| [Swagger / OpenAPI](https://docs.nestjs.com/openapi/introduction) | v11 | Documentación interactiva de la API |
| [Multer](https://github.com/expressjs/multer) | v2 | Subida de archivos |
| [XLSX](https://sheetjs.com/) | v0.18 | Lectura de archivos Excel |
| [bcrypt](https://github.com/kelektiv/node.bcrypt.js) | v6 | Hash de contraseñas |
| [date-fns](https://date-fns.org/) | v4 | Manipulación de fechas |
| [Docker Compose](https://docs.docker.com/compose/) | — | Orquestación de servicios (BD + API) |
| TypeScript | v5 | Lenguaje principal |

---

## Arquitectura y módulos

El proyecto sigue la arquitectura modular de NestJS. Cada dominio se encapsula en su propio módulo con controlador, servicio, entidad y DTOs.

```
src/
├── auth/             # Autenticación JWT (login, register, refresh token)
├── users/            # Gestión de usuarios del sistema
├── perfiles/         # Perfiles de empleados
├── proyectos/        # Proyectos de la empresa
├── distribuciones/   # Asignación de % de dedicación por empleado/proyecto/período
├── registros/        # Datos de nómina por empleado y período
├── calculos/         # Motor de cálculo: distribución de costes cruzando nóminas y %
├── import/           # Importación masiva de datos desde Excel
├── auditoria/        # Log de auditoría de operaciones
├── status/           # Endpoint de estado del servidor
└── common/           # Guards, decoradores, interceptores y middlewares compartidos
```

---

## Modelo de datos

```
User
 └── id (UUID), email (único), password (hash), nombre, role (admin | user)

Perfil
 └── id, nombre, dni (único)
 ├── → Distribuciones (OneToMany)
 └── → Registros (OneToMany)

Proyecto
 └── id, nombre
 └── → Distribuciones (OneToMany)

Distribucion
 └── id, fechaInicio, fechaFin, porcentaje (%), estado (antiguo | nuevo)
 ├── → Perfil (ManyToOne)
 └── → Proyecto (ManyToOne)

Registro  (datos de nómina)
 └── id, tipoDato (real | estimacion), devengado, aportacion, horas,
     fechaInicio, fechaFin, empresa,
     multiplicadorInferior, multiplicadorSuperior
 └── → Perfil (ManyToOne)

Auditoria
 └── id, usuario, accion (CREATE | UPDATE | DELETE),
     entidad, entidadId, detalles, fecha, ip
```

---

## Endpoints de la API

### Auth — `/auth`

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `POST` | `/auth/login` | Inicio de sesión. Devuelve `access_token` y `refresh_token` | Público |
| `POST` | `/auth/register` | Registro de nuevo usuario | Público |
| `POST` | `/auth/refresh` | Renovar el access token con el refresh token | Público |

### Perfiles — `/perfiles`

| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| `POST` | `/perfiles` | Crear perfil | Admin |
| `GET` | `/perfiles` | Listar todos los perfiles | Autenticado |
| `GET` | `/perfiles/:id` | Obtener perfil por ID | Autenticado |
| `PUT` | `/perfiles/:id` | Actualizar perfil | Admin |
| `DELETE` | `/perfiles/:id` | Eliminar perfil | Admin |

### Proyectos — `/proyectos`

| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| `POST` | `/proyectos` | Crear proyecto | Admin |
| `GET` | `/proyectos` | Listar todos los proyectos | Autenticado |
| `GET` | `/proyectos/:id` | Obtener proyecto por ID | Autenticado |
| `PUT` | `/proyectos/:id` | Actualizar proyecto | Admin |
| `DELETE` | `/proyectos/:id` | Eliminar proyecto | Admin |

### Distribuciones — `/distribuciones`

| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| `POST` | `/distribuciones` | Crear distribución (asignar % a proyecto) | Admin |
| `GET` | `/distribuciones` | Listar distribuciones | Autenticado |
| `GET` | `/distribuciones/:id` | Obtener distribución por ID | Autenticado |
| `PATCH` | `/distribuciones/:id` | Actualizar distribución | Admin |
| `DELETE` | `/distribuciones/:id` | Eliminar distribución | Admin |

### Registros de nómina — `/registros`

| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| `POST` | `/registros` | Crear registro de nómina | Admin |
| `GET` | `/registros` | Listar registros | Autenticado |
| `GET` | `/registros/:id` | Obtener registro por ID | Autenticado |
| `PUT` | `/registros/:id` | Actualizar registro | Admin |
| `DELETE` | `/registros/:id` | Eliminar registro | Admin |

### Cálculos — `/calculos`

| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| `GET` | `/calculos/desglose` | Desglose de costes por perfil → mes → proyecto | Autenticado |
| `GET` | `/calculos/porcentaje-libre` | Porcentaje e horas sin asignar de un perfil en un rango | Autenticado |

El endpoint `desglose` acepta los siguientes query params:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `fechaInicio` | `date` (YYYY-MM-DD) | Inicio del rango de consulta |
| `fechaFin` | `date` (YYYY-MM-DD) | Fin del rango de consulta |
| `tipoDato` | `real \| estimacion \| mixta` | Tipo de dato de nómina a usar |
| `perfiles` | `string` (IDs separados por coma) | Filtrar por perfiles |
| `proyectos` | `string` (IDs separados por coma) | Filtrar por proyectos |
| `empresas` | `string` (nombres separados por coma) | Filtrar por empresa |
| `contratacion` | `antiguo \| nuevo` (separados por coma) | Filtrar por tipo de contratación |

### Importación — `/import`

| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| `POST` | `/import/excel` | Subir archivo `.xls`/`.xlsx` para importar registros de nómina | Admin |

El cuerpo de la petición es `multipart/form-data` con los campos `file`, `fechaInicio`, `fechaFin` y `empresa`.

### Auditoría — `/auditoria`

| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| `GET` | `/auditoria` | Listar todos los registros de auditoría (con filtros por query) | Admin |
| `GET` | `/auditoria/:id` | Obtener registro de auditoría por ID | Admin |
| `GET` | `/auditoria/:entidad/:entidadId` | Historial de una entidad concreta | Admin |

### Status — `/status`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/status` | Estado del servidor | Público |

---

## Autenticación y roles

La API usa **JWT Bearer tokens** con soporte para **access token** (corta duración) y **refresh token** (larga duración).

**Flujo:**
1. El cliente llama a `POST /auth/login` y recibe `access_token`, `refresh_token` y `expires_in`.
2. El `access_token` se incluye en el header `Authorization: Bearer <token>` en cada petición protegida.
3. Cuando el `access_token` expira, el cliente llama a `POST /auth/refresh` con el `refresh_token` para obtener uno nuevo sin volver a introducir credenciales.

**Roles disponibles:**

| Rol | Valor en BD | Permisos |
|-----|-------------|----------|
| `Admin` | `admin` | Lectura + escritura + eliminación en todos los recursos + auditoría |
| `Employee` | `user` | Solo lectura en perfiles, proyectos, distribuciones, registros y cálculos |

---

## Sistema de auditoría

Cada operación de escritura (`CREATE`, `UPDATE`, `DELETE`) sobre las entidades principales queda registrada automáticamente en la tabla `auditoria` mediante un **interceptor global** (`AuditoriaInterceptor`).

Información que se almacena por cada evento:
- Usuario que realizó la acción (email).
- Tipo de acción (`CREATE`, `UPDATE`, `DELETE`).
- Entidad afectada y su ID.
- Detalles adicionales (payload).
- Fecha y hora exacta.
- IP del cliente.

---

## Importación desde Excel

El módulo `import` permite cargar masivamente datos de nóminas desde un archivo Excel (`.xls` / `.xlsx`). El archivo se sube al directorio `uploads/` del servidor y se procesa con la librería `xlsx`. Por cada fila válida se crea un `Registro` asociado al perfil correspondiente, con los datos de las columnas mapeadas al modelo de datos.

---

## Motor de cálculo

El módulo `calculos` implementa la lógica central de la aplicación: **distribuir el coste de cada empleado entre los proyectos en los que ha trabajado**, iterando día a día dentro del rango consultado.

**Lógica principal:**
1. Para cada perfil, se obtienen sus registros de nómina activos en el período.
2. Para cada día del rango, se busca qué distribución (%) estaba vigente ese día por proyecto.
3. El coste diario (devengado, aportación, horas) se prorratea por ese porcentaje hacia cada proyecto.
4. Los resultados se agrupan por `perfil → mes → proyecto`.

Soporta tres modos:
- **`real`**: usa únicamente registros con `tipoDato = 'real'`.
- **`estimacion`**: usa únicamente registros con `tipoDato = 'estimacion'`.
- **`mixta`**: combina ambos tipos priorizando datos reales cuando existen.

---

## Instalación y puesta en marcha

### Requisitos previos

- [Node.js](https://nodejs.org/) >= 18
- [Docker](https://www.docker.com/) y Docker Compose (para levantar la base de datos)

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd api-laboral-back
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y rellena los valores:

```bash
cp .env.example .env
```

> Ver la sección [Variables de entorno](#variables-de-entorno) para detalle de cada variable.

### 4. Levantar la base de datos con Docker

```bash
docker-compose up -d
```

Esto arranca un contenedor PostgreSQL 16 con la configuración del `.env`.

### 5. Arrancar la API

```bash
# Desarrollo (hot-reload)
npm run start:dev

# Producción
npm run build
npm run start:prod
```

La API estará disponible en `http://localhost:3000`.  
La documentación Swagger estará en `http://localhost:3000/api`.

---

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Base de datos
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=tu_usuario
DB_PASSWORD=tu_contraseña
DB_DATABASE=nombre_base_de_datos

# JWT
JWT_SECRET=tu_secreto_super_seguro
JWT_EXPIRATION=5m
JWT_REFRESH_SECRET=otro_secreto_para_refresh
JWT_REFRESH_EXPIRATION=7d
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DB_TYPE` | Tipo de base de datos | `postgres` |
| `DB_HOST` | Host de la base de datos | `localhost` |
| `DB_PORT` | Puerto de la base de datos | `5432` |
| `DB_USERNAME` | Usuario de la base de datos | `admin` |
| `DB_PASSWORD` | Contraseña de la base de datos | `secret` |
| `DB_DATABASE` | Nombre de la base de datos | `laboral_db` |
| `JWT_SECRET` | Secreto para firmar access tokens | `mi_secreto` |
| `JWT_EXPIRATION` | Duración del access token | `5m`, `1h` |
| `JWT_REFRESH_SECRET` | Secreto para firmar refresh tokens | `otro_secreto` |
| `JWT_REFRESH_EXPIRATION` | Duración del refresh token | `7d` |

> **Nota:** El archivo `.env` nunca debe subirse al repositorio. Asegúrate de que está incluido en `.gitignore`.

---

## Documentación Swagger

Una vez arrancado el servidor, accede a la documentación interactiva en:

```
http://localhost:3000/api
```

Swagger permite explorar todos los endpoints, ver los esquemas de petición/respuesta y probar la API directamente desde el navegador. Para los endpoints protegidos, usa el botón **Authorize** con el `access_token` obtenido en el login.

---

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run start` | Arranca el servidor en modo normal |
| `npm run start:dev` | Arranca con hot-reload (desarrollo) |
| `npm run start:debug` | Arranca en modo debug con hot-reload |
| `npm run start:prod` | Arranca el build de producción |
| `npm run build` | Compila el proyecto TypeScript |
| `npm run format` | Formatea el código con Prettier |
| `npm run lint` | Analiza y corrige el código con ESLint |
| `npm run test` | Ejecuta los tests unitarios |
| `npm run test:watch` | Tests en modo watch |
| `npm run test:cov` | Tests con reporte de cobertura |
| `npm run test:e2e` | Ejecuta los tests end-to-end |
