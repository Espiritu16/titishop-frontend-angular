# TitiShop Frontend

## 1. Descripción del proyecto

Aplicación frontend construida con Angular para operar el sistema TitiShop desde una interfaz web.

Este repositorio contiene:

- pantalla de autenticación,
- layout principal con sidebar y topbar,
- rutas protegidas por sesión y roles,
- módulos de productos, proveedores, inventario, movimientos, reportes, usuarios y configuración,
- servicios HTTP alineados con la API Spring Boot,
- modelos TypeScript para contratos frontend-backend,
- manejo de token JWT en `sessionStorage`,
- estilos globales con Tailwind CSS y Bootstrap Icons.

## 2. Objetivo del frontend

Proveer la interfaz web del sistema TitiShop para que los usuarios autenticados puedan administrar catálogos, controlar inventario, registrar movimientos, consultar reportes y revisar indicadores operativos.

El frontend consume el backend en:

```text
Local:      http://localhost:8080/api
Producción: https://api-titishop.proyectoutp.com/api
```

## 3. Estado de implementación

El frontend tiene implementadas las vistas principales del flujo operativo:

- login,
- panel/dashboard,
- productos,
- proveedores,
- inventario,
- movimientos,
- reportes,
- usuarios,
- configuración.

También incluye pruebas unitarias para rutas, configuración de API, validaciones y componentes base.

## 4. Arquitectura y stack

| Stack                         | Uso en el proyecto                                  |
| ----------------------------- | --------------------------------------------------- |
| Angular 21                    | Framework principal SPA.                            |
| TypeScript 5.9                | Lenguaje base del frontend.                         |
| Angular Router                | Definición de rutas, guards inline y redirecciones. |
| Reactive Forms                | Manejo de formularios tipados en componentes.       |
| Angular HttpClient            | Consumo de endpoints REST del backend.              |
| Angular Signals               | Estado reactivo de sesión en `AuthService`.         |
| RxJS                          | Flujos HTTP y side effects de autenticación.        |
| Tailwind CSS 4                | Utilidades de estilos globales.                     |
| Bootstrap Icons               | Iconografía de la interfaz.                         |
| Vitest / Angular Test Builder | Pruebas unitarias.                                  |
| jsdom                         | Entorno de pruebas tipo navegador.                  |
| PNPM 11.5.0                   | Gestor de paquetes.                                 |
| Nginx                         | Servidor estático para Docker/producción.           |

## 5. Dependencias principales

Dependencias declaradas en `package.json`.

**Dependencias de producción:**

- `@angular/common`, `@angular/compiler`, `@angular/core`, `@angular/forms`, `@angular/platform-browser`, `@angular/router` v21.2.x
- `bootstrap-icons` v1.13.1
- `rxjs` v7.8.x
- `tslib` v2.3.x
- `zone.js` v0.16.x

**Dependencias de desarrollo:**

- `@angular/build` v21.2.8
- `@angular/cli` v21.2.8
- `@angular/compiler-cli` v21.2.x
- `@tailwindcss/postcss` v4.3.0
- `@tailwindcss/vite` v4.3.0
- `tailwindcss` v4.3.0
- `postcss` v8.5.x
- `typescript` v5.9.x
- `vitest` v4.0.x
- `jsdom` v28.0.x
- `prettier` v3.8.x

## 6. Estructura del proyecto

```text
titishop-frontend-angular/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── http/
│   │   │   │   ├── api-client.service.ts
│   │   │   │   └── auth-token.interceptor.ts
│   │   │   ├── api-error.ts
│   │   │   ├── api.config.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── estado-carga.ts
│   │   │   ├── models.ts
│   │   │   └── validaciones.ts
│   │   ├── features/
│   │   │   ├── configuracion/
│   │   │   ├── inventario/
│   │   │   ├── layout/
│   │   │   │   ├── app-shell/
│   │   │   │   ├── sidebar/
│   │   │   │   └── topbar/
│   │   │   ├── login/
│   │   │   ├── movimientos/
│   │   │   ├── panel/
│   │   │   ├── productos/
│   │   │   ├── proveedores/
│   │   │   ├── reportes/
│   │   │   └── usuarios/
│   │   ├── app.config.ts
│   │   ├── app.routes.ts
│   │   └── app.ts
│   ├── index.html
│   ├── main.ts
│   ├── styles.scss
│   └── tailwind.css
├── Dockerfile
├── nginx.conf
├── angular.json
├── package.json
├── pnpm-lock.yaml
└── README.md
```

## 7. Módulos y rutas implementadas

Rutas definidas en `src/app/app.routes.ts`.

### Rutas públicas

| Ruta     | Componente | Descripción                  |
| -------- | ---------- | ---------------------------- |
| `/login` | `Login`    | Formulario de autenticación. |

### Rutas protegidas

Todas las rutas internas usan `AppShell` y requieren sesión activa mediante `requireAuth`.

| Ruta             | Componente      | Acceso                         |
| ---------------- | --------------- | ------------------------------ |
| `/inicio`        | `Panel`         | Usuario autenticado            |
| `/dashboard`     | `Panel`         | Usuario autenticado            |
| `/productos`     | `Productos`     | Usuario autenticado            |
| `/proveedores`   | `Proveedores`   | Usuario autenticado            |
| `/inventario`    | `Inventario`    | Usuario autenticado            |
| `/movimientos`   | `Movimientos`   | Usuario autenticado            |
| `/reportes`      | `Reportes`      | `ADMINISTRADOR` / `SUPERVISOR` |
| `/usuarios`      | `Usuarios`      | `ADMINISTRADOR`                |
| `/configuracion` | `Configuracion` | `ADMINISTRADOR`                |

### Comportamiento de enrutamiento

- `/login` se bloquea para usuarios ya autenticados y redirige a `/dashboard`.
- Las rutas internas validan que exista usuario de sesión y token.
- La ruta interna vacía redirige a `/dashboard`.
- La ruta wildcard redirige a `/dashboard`.
- Si un usuario autenticado no tiene el rol requerido, se redirige a `/dashboard`.

## 8. Capa core

| Archivo                                       | Responsabilidad                                                       |
| --------------------------------------------- | --------------------------------------------------------------------- |
| `src/app/core/api.config.ts`                  | Calcula la URL base del backend según host local o producción.        |
| `src/app/core/auth.service.ts`                | Login, logout, restauración de sesión, token y verificación de roles. |
| `src/app/core/models.ts`                      | Contratos TypeScript compartidos con la API.                          |
| `src/app/core/api-error.ts`                   | Estructura de errores HTTP de la API.                                 |
| `src/app/core/estado-carga.ts`                | Estados reutilizables para carga, éxito, error y vacío.               |
| `src/app/core/validaciones.ts`                | Validaciones compartidas de formularios.                              |
| `src/app/core/http/api-client.service.ts`     | Cliente HTTP genérico para GET, POST, PUT y DELETE.                   |
| `src/app/core/http/auth-token.interceptor.ts` | Interceptor que agrega `Authorization: Bearer {token}`.               |

## 9. Servicios por módulo

| Módulo        | Servicio                 | Backend consumido               |
| ------------- | ------------------------ | ------------------------------- |
| Autenticación | `AuthService`            | `POST /api/autenticacion/login` |
| Productos     | `productos.service.ts`   | `/api/productos`                |
| Archivos      | `productos.service.ts`   | `POST /api/archivos/productos`  |
| Categorías    | `categorias.service.ts`  | `/api/categorias`               |
| Marcas        | `marcas.service.ts`      | `/api/marcas`                   |
| Proveedores   | `proveedores.service.ts` | `/api/proveedores`              |
| Inventario    | `inventario.service.ts`  | `/api/inventario`               |
| Movimientos   | `movimientos.service.ts` | `/api/movimientos`              |
| Reportes      | `reportes.service.ts`    | `/api/reportes`                 |
| Panel         | `panel.service.ts`       | `/api/panel/resumen`            |
| Usuarios      | `usuarios.service.ts`    | `/api/usuarios`                 |

## 10. Integración con backend

La integración se centraliza en `src/app/core/api.config.ts`.

```typescript
const API_LOCAL_URL = 'http://localhost:8080/api';
const API_PRODUCCION_URL = 'https://api-titishop.proyectoutp.com/api';
```

Reglas:

- Si el frontend corre en `localhost` o `127.0.0.1`, consume backend local en `http://localhost:8080/api`.
- En cualquier otro host, consume `https://api-titishop.proyectoutp.com/api`.
- `apiUrl()` normaliza rutas con o sin prefijo `/api`.
- Los servicios por módulo consumen endpoints REST del backend Spring Boot.

## 11. Seguridad y acceso

### Autenticación

- El login envía email normalizado a minúsculas y password a `/api/autenticacion/login`.
- El backend retorna token, tipo, expiración y datos del usuario.
- El token se guarda en `sessionStorage` con la clave `token_sesion`.
- Los datos de usuario se guardan en `sessionStorage` con la clave `usuario_sesion`.
- Al recargar la página, `AuthService` intenta restaurar la sesión.
- El logout limpia la sesión y redirige al inicio.

### Autorización

Roles soportados:

- `ADMINISTRADOR`
- `ALMACENERO`
- `SUPERVISOR`

Protección en frontend:

- `requireAuth`: exige sesión y token.
- `onlyGuest`: evita que usuarios autenticados vuelvan a `/login`.
- `requireRoles`: valida roles permitidos por ruta.

Protección real de datos:

- El backend también valida roles en cada endpoint protegido.
- El frontend solo controla navegación y experiencia de usuario; no reemplaza la autorización del backend.

## 12. Contratos principales

Los contratos viven en `src/app/core/models.ts`.

| Modelo                               | Uso                                                    |
| ------------------------------------ | ------------------------------------------------------ |
| `LoginRequest` / `LoginResponse`     | Autenticación.                                         |
| `SessionUser`                        | Usuario actual en sesión.                              |
| `CategoriaResponse`, `MarcaResponse` | Catálogos de productos.                                |
| `ProductoResponse`                   | Productos con categoría, marca, precios e imagen.      |
| `ArchivoResponse`                    | Respuesta de carga de imagen.                          |
| `ProveedorResponse`                  | Proveedores y datos de contacto.                       |
| `ConsultaRucProveedorResponse`       | Datos obtenidos por consulta RUC.                      |
| `InventarioResponse`                 | Stock, stock mínimo, ubicación y estado.               |
| `MovimientoResponse`                 | Historial de entradas, salidas, ajustes y anulaciones. |
| `UsuarioResponse`                    | Usuarios, roles y estados.                             |
| `PanelResumenResponse`               | Indicadores del dashboard.                             |
| `Reporte*Response`                   | Reportes operativos y valorización.                    |

## 13. Ejecución local

Requisitos:

- Node.js compatible con Angular 21
- PNPM 11.5.0
- Backend TitiShop ejecutándose en `http://localhost:8080`

Instalación:

```bash
pnpm install
```

Servidor de desarrollo:

```bash
pnpm start
```

Aplicación local:

```text
http://localhost:4200
```

## 14. Build de producción

```bash
pnpm build
```

El build genera los artefactos en `dist/`.

Para producción, el proyecto incluye:

- `Dockerfile`
- `nginx.conf`

URL pública esperada:

```text
https://titishop.proyectoutp.com
```

## 15. Pruebas automatizadas

Ejecutar pruebas:

```bash
pnpm test
```

Pruebas existentes:

- rutas principales y guards,
- configuración de API,
- validaciones compartidas,
- componente raíz.

## 16. Diagrama de arquitectura frontend

```mermaid
flowchart TB
  subgraph C1["Capa Presentación"]
    LOGIN["login"]
    SHELL["layout/app-shell"]
    NAV["sidebar + topbar"]
    FEATURES["features<br/>panel, productos, proveedores,<br/>inventario, movimientos, reportes,<br/>usuarios, configuración"]
  end

  subgraph C2["Capa Aplicación"]
    ROUTES["app.routes.ts"]
    AUTH["AuthService<br/>sesión, token, roles"]
    MODELS["models.ts<br/>contratos API"]
    VALID["validaciones.ts<br/>reglas de formularios"]
  end

  subgraph C3["Capa Infraestructura"]
    API_CLIENT["ApiClientService"]
    TOKEN_INT["auth-token.interceptor"]
    API_CFG["api.config.ts<br/>localhost o producción"]
  end

  subgraph C4["Backend"]
    API[("TitiShop Backend<br/>Spring Boot /api")]
  end

  LOGIN --> AUTH
  SHELL --> NAV
  SHELL --> FEATURES
  ROUTES --> LOGIN
  ROUTES --> SHELL
  FEATURES --> API_CLIENT
  FEATURES --> MODELS
  FEATURES --> VALID
  API_CLIENT --> API_CFG
  TOKEN_INT --> AUTH
  API_CLIENT --> TOKEN_INT
  TOKEN_INT --> API
```

## 17. Protección de rutas por roles

```text
/login
  |
  +-- onlyGuest
      |
      +-- si ya hay sesión -> /dashboard

/
  |
  +-- requireAuth
      |
      +-- /inicio
      +-- /dashboard
      +-- /productos
      +-- /proveedores
      +-- /inventario
      +-- /movimientos
      |
      +-- requireRoles(ADMINISTRADOR, SUPERVISOR)
      |   +-- /reportes
      |
      +-- requireRoles(ADMINISTRADOR)
          +-- /usuarios
          +-- /configuracion
```

## 18. Flujo de autenticación

1. El usuario ingresa email y password en `/login`.
2. `AuthService.login()` envía credenciales a `/api/autenticacion/login`.
3. El backend valida credenciales y retorna JWT.
4. El frontend guarda token y usuario en `sessionStorage`.
5. Las rutas internas quedan disponibles mientras exista sesión y token.
6. El interceptor HTTP agrega `Authorization: Bearer {token}` a requests autenticados.
7. Si el usuario cierra sesión, se limpia `sessionStorage` y se redirige.

## 19. Gestión del proyecto

El seguimiento de tareas, backlog y tablero del proyecto se realiza en Jira:

- [Tablero Jira TitiShop](https://utp-desarrollo.atlassian.net/jira/software/projects/DV/boards/1/backlog)

## 20. Alcance del README

Este README documenta el frontend Angular de TitiShop.

No incluye:

- diagrama ER de base de datos,
- migraciones SQL,
- reglas internas completas del backend,
- credenciales reales de producción,
- manual de usuario final.

La documentación técnica del backend se encuentra en el README del repositorio `titishop-backend-springboot`.
