# Integracion Backend Frontend y Normalizacion Espanol Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Conectar el frontend Angular con el backend Spring Boot, eliminar datos simulados/locales, normalizar nombres del frontend a espanol cuando aplique y reforzar validaciones en ambos lados.

**Architecture:** El frontend debe consumir servicios HTTP tipados por recurso y dejar los componentes como capa de presentacion. El backend mantiene la fuente de verdad, incluyendo validaciones, estados logicos y reglas de negocio. La normalizacion de nombres se hace por fases para no romper rutas, imports ni convenciones propias de Angular/TypeScript.

**Tech Stack:** Angular standalone components, typed reactive forms, HttpClient, RxJS, Spring Boot, Jakarta Bean Validation, MySQL, Flyway, Maven, pnpm.

---

## Estado Actual Relevante

- Frontend worktree: `/Users/sankef/HERRAMIENTAS DE DESARROLLO/titishop-frontend-angular`
- Backend worktree: `/Users/sankef/HERRAMIENTAS DE DESARROLLO/titishop-backend-springboot`
- Frontend branch actual: `fix/limpieza-local-storage`
- Backend branch actual: `feature/conexion-backend-frontend`
- API base frontend: `src/app/core/api.config.ts`
- Modelos API actuales: `src/app/core/models.ts`
- Rutas frontend actuales en espanol: `/productos`, `/proveedores`, `/inventario`, `/movimientos`, `/reportes`, `/usuarios`, `/configuracion`
- Carpetas/componentes frontend aun en ingles: `dashboard`, `products`, `providers`, `inventory`, `movements`, `reports`, `users`, `settings`
- Backend usa rutas y paquetes mayormente en espanol: `/api/productos`, `/api/categorias`, `/api/marcas`, `/api/proveedores`, `/api/inventario`, `/api/movimientos`, `/api/reportes`, `/api/usuarios`, `/api/panel`
- Login/guards del frontend estan temporalmente removidos para revisar pantallas.
- No debe reintroducirse `localStorage` para datos de negocio.

## Convencion de Nombres

Mantener en ingles por estandarizacion tecnica:
- Sufijos TypeScript/Angular: `Request`, `Response`, `Service`, `Guard`, `Interceptor`, `Component`, `Pipe`, `Directive`, `Resolver`.
- APIs/librerias/framework: `HttpClient`, `FormBuilder`, `Validators`, `Observable`, `subscribe`, `pipe`, `map`, `catchError`.
- Archivos de configuracion estandar: `environment`, `app.config`, `app.routes`, `package.json`, `angular.json`.
- Carpetas tecnicas muy comunes: `core`, `layout`.

Normalizar a espanol:
- Entidades de negocio: `Product` -> `Producto`, `Provider` -> `Proveedor`, `Category` -> `Categoria`, `Brand` -> `Marca`, `Inventory` -> `Inventario`, `Movement` -> `Movimiento`, `User` -> `Usuario`, `Report` -> `Reporte`, `Dashboard` -> `Panel`.
- Carpetas feature: `products` -> `productos`, `providers` -> `proveedores`, `inventory` -> `inventario`, `movements` -> `movimientos`, `reports` -> `reportes`, `users` -> `usuarios`, `settings` -> `configuracion`, `dashboard` -> `panel`.
- Metodos de negocio: `saveProduct` -> `guardarProducto`, `toggleStatus` -> `cambiarEstadoProducto`, `consultRuc` -> `consultarRuc`, `loadProducts` -> `cargarProductos`.

## Mapa de Integracion por Recurso

| Pantalla | Backend | Frontend esperado |
| --- | --- | --- |
| Panel | `GET /api/panel/resumen` | KPIs y ultimos movimientos reales |
| Productos | `GET/POST/PUT/DELETE /api/productos` | CRUD real, estado logico |
| Categorias | `GET/POST/PUT/DELETE /api/categorias` | Modal de categorias conectado |
| Marcas | `GET/POST/PUT/DELETE /api/marcas` | Catalogo real para productos |
| Proveedores | `GET/POST/PUT/DELETE /api/proveedores`, `GET /api/proveedores/consulta-ruc/{ruc}` | CRUD real y consulta RUC |
| Inventario | `GET/POST/PUT/DELETE /api/inventario` | Stock real por producto |
| Movimientos | `GET/POST /api/movimientos`, `POST /api/movimientos/{id}/anulacion` | Entradas/salidas/ajustes reales |
| Reportes | `GET /api/reportes/*` | Reportes reales con filtros |
| Usuarios | `GET/POST/PUT/DELETE /api/usuarios` | CRUD real y estado logico |
| Autenticacion | `POST /api/autenticacion/login` | Pendiente de reactivar cuando se termine la revision visual |

## Archivos Principales a Crear o Modificar

Frontend:
- Crear: `src/app/core/estado-carga.ts`
- Crear: `src/app/core/http/api-client.service.ts`
- Crear: `src/app/core/http/auth-token.interceptor.ts`
- Crear: `src/app/core/validaciones.ts`
- Modificar: `src/app/core/models.ts`
- Modificar: `src/app/core/api-error.ts`
- Modificar: `src/app/app.config.ts`
- Modificar: `src/app/app.routes.ts`
- Renombrar carpetas feature segun la seccion de convencion.
- Crear servicios por recurso:
  - `src/app/features/productos/productos.service.ts`
  - `src/app/features/productos/categorias.service.ts`
  - `src/app/features/productos/marcas.service.ts`
  - `src/app/features/proveedores/proveedores.service.ts`
  - `src/app/features/inventario/inventario.service.ts`
  - `src/app/features/movimientos/movimientos.service.ts`
  - `src/app/features/reportes/reportes.service.ts`
  - `src/app/features/usuarios/usuarios.service.ts`
  - `src/app/features/panel/panel.service.ts`

Backend:
- Revisar: `src/main/java/com/titishop/productos/controller/CategoriaController.java`
- Revisar: `src/main/java/com/titishop/productos/controller/MarcaController.java`
- Revisar: `src/main/java/com/titishop/productos/controller/ProductoController.java`
- Revisar: `src/main/java/com/titishop/proveedores/controller/ProveedorController.java`
- Revisar: `src/main/java/com/titishop/inventario/controller/InventarioController.java`
- Revisar: `src/main/java/com/titishop/movimientos/controller/MovimientoController.java`
- Revisar: `src/main/java/com/titishop/usuarios/controller/UsuarioController.java`
- Revisar: `src/main/java/com/titishop/compartido/exception/ManejadorGlobalException.java`
- Agregar o ajustar tests de controller/service cuando falte cobertura.

---

### Task 1: Congelar Contrato Backend y Validaciones

**Files:**
- Modify: `/Users/sankef/HERRAMIENTAS DE DESARROLLO/titishop-backend-springboot/src/main/java/com/titishop/compartido/exception/ManejadorGlobalException.java`
- Modify as needed: backend DTOs under `src/main/java/com/titishop/**/dto/*.java`
- Test: backend controller/service tests for productos, categorias, marcas, proveedores, inventario, movimientos, usuarios

- [ ] **Step 1: Auditar endpoints y DTOs**

Run:

```bash
cd "/Users/sankef/HERRAMIENTAS DE DESARROLLO/titishop-backend-springboot"
rg -n "@RequestMapping|@GetMapping|@PostMapping|@PutMapping|@DeleteMapping|@Valid|@NotBlank|@NotNull|@Size|@Pattern|@Email|@Min|@Positive|@DecimalMin" src/main/java/com/titishop
```

Expected:
- Cada `POST` y `PUT` recibe `@Valid`.
- Cada request DTO tiene validaciones concretas.
- Los `DELETE` existentes representan cambio de estado logico, no eliminacion fisica.

- [ ] **Step 2: Confirmar contrato de estado logico**

Verificar en services:

```bash
cd "/Users/sankef/HERRAMIENTAS DE DESARROLLO/titishop-backend-springboot"
rg -n "deleteById|delete\\(|estado|ACTIVO|INACTIVO" src/main/java/com/titishop/productos src/main/java/com/titishop/proveedores src/main/java/com/titishop/inventario src/main/java/com/titishop/usuarios
```

Expected:
- No se usa `deleteById` para categorias, marcas, productos, proveedores, inventario o usuarios.
- Las operaciones tipo `DELETE /{id}` cambian `estado` a `INACTIVO`.
- Si ya existe un metodo con nombre `eliminar`, documentar que internamente es baja logica o renombrar a `cambiarEstado`/`desactivar` si el cambio no rompe contrato.

- [ ] **Step 3: Normalizar payload de errores**

Confirmar que `ManejadorGlobalException` retorna:

```json
{
  "timestamp": "2026-06-03T00:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validacion fallida",
  "path": "/api/productos",
  "details": ["nombre: no debe estar vacio"]
}
```

Expected:
- Frontend puede mapear `message` y `details`.
- No se exponen secretos, tokens ni datos sensibles.

- [ ] **Step 4: Ejecutar validacion backend**

Run:

```bash
cd "/Users/sankef/HERRAMIENTAS DE DESARROLLO/titishop-backend-springboot"
./mvnw test
```

Expected:
- Build y tests pasan.
- Si falla por DB local, ejecutar primero con perfil/testcontainers configurado o aislar test con H2/test profile antes de cambiar frontend.

---

### Task 2: Crear Capa HTTP Tipada del Frontend

**Files:**
- Create: `src/app/core/http/api-client.service.ts`
- Create: `src/app/core/estado-carga.ts`
- Modify: `src/app/core/api-error.ts`
- Modify: `src/app/core/models.ts`
- Test: `src/app/core/api-error.spec.ts`

- [ ] **Step 1: Crear estado comun de carga**

Create `src/app/core/estado-carga.ts`:

```ts
export type EstadoCarga = 'inicial' | 'cargando' | 'exito' | 'error';

export interface ResultadoCarga<T> {
  estado: EstadoCarga;
  datos: T;
  error: string;
}
```

- [ ] **Step 2: Crear cliente API comun**

Create `src/app/core/http/api-client.service.ts`:

```ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../api.config';

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  constructor(private http: HttpClient) {}

  get<T>(path: string): Observable<T> {
    return this.http.get<T>(apiUrl(path));
  }

  post<TResponse, TRequest extends object>(path: string, body: TRequest): Observable<TResponse> {
    return this.http.post<TResponse>(apiUrl(path), body);
  }

  put<TResponse, TRequest extends object>(path: string, body: TRequest): Observable<TResponse> {
    return this.http.put<TResponse>(apiUrl(path), body);
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(apiUrl(path));
  }
}
```

- [ ] **Step 3: Alinear modelos con backend**

Modify `src/app/core/models.ts`:

```ts
export type RolUsuario = 'ADMINISTRADOR' | 'ALMACENERO' | 'SUPERVISOR';
export type EstadoCatalogo = 'ACTIVO' | 'INACTIVO';
export type TipoMovimiento = 'ENTRADA' | 'SALIDA' | 'AJUSTE';

export interface CategoriaResponse {
  id: string;
  nombre: string;
  estado: EstadoCatalogo;
}

export interface CrearCategoriaRequest {
  nombre: string;
}

export interface ActualizarCategoriaRequest {
  nombre: string;
  estado: EstadoCatalogo;
}
```

Expected:
- Migrar gradualmente el resto de interfaces de `CategoryResponse`/`BrandResponse` a `CategoriaResponse`/`MarcaResponse`.
- Mantener `Request` y `Response` porque son sufijos estandar.

- [ ] **Step 4: Validar build**

Run:

```bash
cd "/Users/sankef/HERRAMIENTAS DE DESARROLLO/titishop-frontend-angular"
pnpm build
```

Expected:
- Build pasa.
- Warnings existentes pueden quedar documentados si no estan dentro del alcance.

---

### Task 3: Normalizar Carpetas y Componentes a Espanol

**Files:**
- Rename: `src/app/features/dashboard` -> `src/app/features/panel`
- Rename: `src/app/features/products` -> `src/app/features/productos`
- Rename: `src/app/features/providers` -> `src/app/features/proveedores`
- Rename: `src/app/features/inventory` -> `src/app/features/inventario`
- Rename: `src/app/features/movements` -> `src/app/features/movimientos`
- Rename: `src/app/features/reports` -> `src/app/features/reportes`
- Rename: `src/app/features/users` -> `src/app/features/usuarios`
- Rename: `src/app/features/settings` -> `src/app/features/configuracion`
- Modify: `src/app/app.routes.ts`
- Modify: imports in affected components

- [ ] **Step 1: Renombrar carpetas con `git mv`**

Run:

```bash
cd "/Users/sankef/HERRAMIENTAS DE DESARROLLO/titishop-frontend-angular"
git mv src/app/features/dashboard src/app/features/panel
git mv src/app/features/products src/app/features/productos
git mv src/app/features/providers src/app/features/proveedores
git mv src/app/features/inventory src/app/features/inventario
git mv src/app/features/movements src/app/features/movimientos
git mv src/app/features/reports src/app/features/reportes
git mv src/app/features/users src/app/features/usuarios
git mv src/app/features/settings src/app/features/configuracion
```

- [ ] **Step 2: Renombrar clases de componentes**

Aplicar estos cambios:

```ts
Dashboard -> Panel
Products -> Productos
Providers -> Proveedores
Inventory -> Inventario
Movements -> Movimientos
Reports -> Reportes
Users -> Usuarios
Settings -> Configuracion
```

Expected:
- `AppShell`, `Sidebar`, `Topbar`, `Login` pueden mantenerse porque son terminos tecnicos o pantalla temporal.

- [ ] **Step 3: Actualizar `app.routes.ts`**

Expected import shape:

```ts
import { Panel } from './features/panel/dashboard';
import { Productos } from './features/productos/products';
import { Proveedores } from './features/proveedores/providers';
import { Inventario } from './features/inventario/inventory';
import { Movimientos } from './features/movimientos/movements';
import { Reportes } from './features/reportes/reports';
import { Usuarios } from './features/usuarios/users';
import { Configuracion } from './features/configuracion/settings';
```

Luego, si se decide renombrar tambien archivos:

```text
dashboard.ts/html/scss -> panel.ts/html/scss
products.ts/html/scss -> productos.ts/html/scss
providers.ts/html/scss -> proveedores.ts/html/scss
inventory.ts/html/scss -> inventario.ts/html/scss
movements.ts/html/scss -> movimientos.ts/html/scss
reports.ts/html/scss -> reportes.ts/html/scss
users.ts/html/scss -> usuarios.ts/html/scss
settings.ts/html/scss -> configuracion.ts/html/scss
```

Expected:
- Rutas URL se mantienen iguales porque ya estan en espanol.
- No cambiar textos visibles sin revisar pantalla por pantalla.

- [ ] **Step 4: Validar imports**

Run:

```bash
cd "/Users/sankef/HERRAMIENTAS DE DESARROLLO/titishop-frontend-angular"
rg -n "features/(dashboard|products|providers|inventory|movements|reports|users|settings)|class (Dashboard|Products|Providers|Inventory|Movements|Reports|Users|Settings)" src/app
pnpm build
```

Expected:
- `rg` no devuelve referencias viejas.
- `pnpm build` pasa.

---

### Task 4: Conectar Catalogos de Productos, Categorias y Marcas

**Files:**
- Create: `src/app/features/productos/categorias.service.ts`
- Create: `src/app/features/productos/marcas.service.ts`
- Create: `src/app/features/productos/productos.service.ts`
- Modify: `src/app/features/productos/productos.ts`
- Modify: `src/app/features/productos/productos.html`

- [ ] **Step 1: Crear servicio de categorias**

Create `src/app/features/productos/categorias.service.ts`:

```ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../core/http/api-client.service';
import { ActualizarCategoriaRequest, CategoriaResponse, CrearCategoriaRequest } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class CategoriasService {
  constructor(private api: ApiClientService) {}

  listar(): Observable<CategoriaResponse[]> {
    return this.api.get<CategoriaResponse[]>('/categorias');
  }

  crear(request: CrearCategoriaRequest): Observable<CategoriaResponse> {
    return this.api.post<CategoriaResponse, CrearCategoriaRequest>('/categorias', request);
  }

  actualizar(id: string, request: ActualizarCategoriaRequest): Observable<CategoriaResponse> {
    return this.api.put<CategoriaResponse, ActualizarCategoriaRequest>(`/categorias/${id}`, request);
  }

  cambiarEstado(id: string): Observable<CategoriaResponse> {
    return this.api.delete<CategoriaResponse>(`/categorias/${id}`);
  }
}
```

- [ ] **Step 2: Reemplazar categorias locales**

En `productos.ts`, reemplazar arreglo local por carga HTTP:

```ts
categorias: CategoriaResponse[] = [];
estadoCategorias: EstadoCarga = 'inicial';
errorCategorias = '';

cargarCategorias(): void {
  this.estadoCategorias = 'cargando';
  this.categoriasService.listar().subscribe({
    next: (categorias) => {
      this.categorias = categorias;
      this.estadoCategorias = 'exito';
      this.errorCategorias = '';
      this.asegurarCategoriaSeleccionada();
    },
    error: (error) => {
      this.estadoCategorias = 'error';
      this.errorCategorias = getApiErrorMessage(error);
    },
  });
}
```

Expected:
- El modal muestra datos reales.
- Activar/desactivar usa endpoint backend de estado logico.
- El select de producto usa categorias activas.

- [ ] **Step 3: Crear servicios de marcas y productos**

Aplicar mismo patron con:

```ts
MarcasService.listar()
MarcasService.crear()
MarcasService.actualizar()
MarcasService.cambiarEstado()
ProductosService.listar()
ProductosService.crear()
ProductosService.actualizar()
ProductosService.cambiarEstado()
```

- [ ] **Step 4: Validar pantalla productos**

Run:

```bash
cd "/Users/sankef/HERRAMIENTAS DE DESARROLLO/titishop-backend-springboot"
./mvnw spring-boot:run
```

En otra terminal:

```bash
cd "/Users/sankef/HERRAMIENTAS DE DESARROLLO/titishop-frontend-angular"
pnpm start
```

Manual QA:
- Abrir `https://titishop.proyectoutp.com/productos`.
- Ver productos reales.
- Abrir modal de categorias.
- Crear categoria.
- Editar categoria.
- Desactivar categoria.
- Confirmar que categoria inactiva no aparece para nuevos productos.
- Confirmar que no hay error CORS ni 401 inesperado.

---

### Task 5: Conectar Proveedores con Validaciones Completas

**Files:**
- Create: `src/app/features/proveedores/proveedores.service.ts`
- Modify: `src/app/features/proveedores/proveedores.ts`
- Modify: `src/app/features/proveedores/proveedores.html`

- [ ] **Step 1: Crear servicio de proveedores**

Create:

```ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../core/http/api-client.service';
import { ProviderRucLookupResponse, ProviderResponse } from '../../core/models';

export interface CrearProveedorRequest {
  ruc: string;
  razonSocial: string;
  nombreComercial?: string;
  telefono?: string;
  email?: string;
  direccion: string;
}

export interface ActualizarProveedorRequest extends CrearProveedorRequest {
  estado: 'ACTIVO' | 'INACTIVO';
}

@Injectable({ providedIn: 'root' })
export class ProveedoresService {
  constructor(private api: ApiClientService) {}

  listar(): Observable<ProviderResponse[]> {
    return this.api.get<ProviderResponse[]>('/proveedores');
  }

  consultarRuc(ruc: string): Observable<ProviderRucLookupResponse> {
    return this.api.get<ProviderRucLookupResponse>(`/proveedores/consulta-ruc/${ruc}`);
  }

  crear(request: CrearProveedorRequest): Observable<ProviderResponse> {
    return this.api.post<ProviderResponse, CrearProveedorRequest>('/proveedores', request);
  }

  actualizar(id: string, request: ActualizarProveedorRequest): Observable<ProviderResponse> {
    return this.api.put<ProviderResponse, ActualizarProveedorRequest>(`/proveedores/${id}`, request);
  }

  cambiarEstado(id: string): Observable<ProviderResponse> {
    return this.api.delete<ProviderResponse>(`/proveedores/${id}`);
  }
}
```

- [ ] **Step 2: Validaciones frontend**

Reglas:
- `ruc`: obligatorio, exactamente 11 digitos, solo numeros.
- `razonSocial`: obligatorio, readonly tras consulta RUC, minimo 3.
- `direccion`: obligatorio, readonly tras consulta RUC si Factiliza devuelve direccion.
- `telefono`: opcional, 6 a 15 digitos si se llena.
- `email`: opcional, formato email si se llena.

Expected:
- Error debajo del input especifico.
- Toast de exito/error para operaciones.
- No guardar si formulario invalido.

- [ ] **Step 3: Validaciones backend espejo**

Confirmar en DTOs:

```java
@NotBlank
@Pattern(regexp = "\\d{11}")
private String ruc;

@NotBlank
@Size(min = 3, max = 255)
private String razonSocial;

@Email
private String email;
```

Expected:
- Backend rechaza datos invalidos aunque frontend falle.
- `RucProveedorDuplicadoException` y `EmailProveedorDuplicadoException` se muestran como error claro en frontend.

---

### Task 6: Conectar Inventario y Movimientos

**Files:**
- Create: `src/app/features/inventario/inventario.service.ts`
- Create: `src/app/features/movimientos/movimientos.service.ts`
- Modify: `src/app/features/inventario/inventario.ts`
- Modify: `src/app/features/movimientos/movimientos.ts`

- [ ] **Step 1: Inventario**

Servicio esperado:

```ts
listar(): Observable<InventarioResponse[]>
crear(request: CrearInventarioRequest): Observable<InventarioResponse>
actualizar(id: string, request: ActualizarInventarioRequest): Observable<InventarioResponse>
cambiarEstado(id: string): Observable<InventarioResponse>
```

Validaciones:
- `productoId`: obligatorio.
- `stockMinimo`: entero mayor o igual a 0.
- `ubicacion`: opcional con maximo 120 caracteres.
- No crear inventario para producto inactivo.

- [ ] **Step 2: Movimientos**

Servicio esperado:

```ts
listar(): Observable<MovimientoResponse[]>
registrar(request: RegistrarMovimientoRequest): Observable<MovimientoResponse>
anular(id: string, motivo: string): Observable<MovimientoResponse>
```

Validaciones:
- `tipo`: obligatorio y uno de `ENTRADA`, `SALIDA`, `AJUSTE`.
- `productoId`: obligatorio.
- `proveedorId`: obligatorio solo para `ENTRADA`.
- `cantidad`: entero positivo.
- `motivo`: obligatorio para `AJUSTE` y anulacion.
- Backend valida stock suficiente para `SALIDA`.

Manual QA:
- Registrar entrada.
- Registrar salida con stock suficiente.
- Intentar salida con stock insuficiente y mostrar error del backend.
- Anular movimiento y confirmar que no se puede anular dos veces.

---

### Task 7: Conectar Panel, Reportes y Usuarios

**Files:**
- Create: `src/app/features/panel/panel.service.ts`
- Create: `src/app/features/reportes/reportes.service.ts`
- Create: `src/app/features/usuarios/usuarios.service.ts`
- Modify: `src/app/features/panel/panel.ts`
- Modify: `src/app/features/reportes/reportes.ts`
- Modify: `src/app/features/usuarios/usuarios.ts`

- [ ] **Step 1: Panel**

Conectar:

```ts
GET /api/panel/resumen
```

Expected:
- KPIs reales.
- Estado vacio si backend retorna listas vacias.
- Error visible si backend no responde.

- [ ] **Step 2: Reportes**

Conectar:

```text
GET /api/reportes/movimientos
GET /api/reportes/stock
GET /api/reportes/stock-critico
GET /api/reportes/valorizacion
```

Validaciones:
- Fechas con rango valido.
- Fecha inicio no mayor a fecha fin.
- Filtros opcionales enviados solo si tienen valor.

- [ ] **Step 3: Usuarios**

Conectar:

```text
GET /api/usuarios
POST /api/usuarios
PUT /api/usuarios/{id}
DELETE /api/usuarios/{id}
```

Validaciones:
- `nombreCompleto`: obligatorio, minimo 3.
- `email`: obligatorio, formato email.
- `rol`: obligatorio.
- `password`: obligatorio en creacion, no enviar vacio en actualizacion.
- `DELETE` se trata como cambio de estado logico.

---

### Task 8: Reactivar Autenticacion de Forma Controlada

**Files:**
- Modify: `src/app/core/auth.service.ts`
- Create: `src/app/core/http/auth-token.interceptor.ts`
- Modify: `src/app/app.config.ts`
- Modify: `src/app/app.routes.ts`
- Modify: `src/app/features/login/login.ts`

- [ ] **Step 1: Token interceptor**

Create:

```ts
import { HttpInterceptorFn } from '@angular/common/http';

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const token = sessionStorage.getItem('titishop_token');
  if (!token) return next(request);

  return next(
    request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    })
  );
};
```

Expected:
- Usar `sessionStorage` solo para token de sesion si se decide reactivar login.
- No usar storage para datos de negocio.

- [ ] **Step 2: Guards**

Reactivar guards despues de terminar QA visual.

Expected:
- Mientras el usuario quiera entrar directo a rutas, dejar documentado que guards estan deshabilitados temporalmente.
- Para produccion, rutas privadas deben exigir autenticacion.

---

### Task 9: Validacion Cruzada Frontend y Backend

**Files:**
- Modify: `src/app/core/validaciones.ts`
- Modify: DTOs backend segun brechas encontradas
- Test: Angular specs y Maven tests

- [ ] **Step 1: Crear validadores frontend reutilizables**

Create `src/app/core/validaciones.ts`:

```ts
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const soloDigitos = (longitud: number): ValidatorFn => {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const value = control.value ?? '';
    if (!value) return null;
    return new RegExp(`^\\d{${longitud}}$`).test(value) ? null : { soloDigitos: { longitud } };
  };
};

export const textoNormalizado = (min: number, max: number): ValidatorFn => {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const value = (control.value ?? '').trim().replace(/\s+/g, ' ');
    if (!value) return null;
    if (value.length < min || value.length > max) return { longitudTexto: { min, max } };
    return /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .,'-]+$/.test(value) ? null : { caracteresInvalidos: true };
  };
};
```

- [ ] **Step 2: Matriz de validaciones**

Validar esta matriz:

| Campo | Frontend | Backend |
| --- | --- | --- |
| RUC | 11 digitos | `@Pattern("\\d{11}")` |
| Email | `Validators.email` | `@Email` |
| Nombre catalogo | requerido, 2-120 | `@NotBlank`, `@Size` |
| SKU | requerido, uppercase, 3-50 | `@NotBlank`, `@Size`, unicidad |
| Precio | numero >= 0 | `@DecimalMin("0.00")` |
| Cantidad movimiento | entero > 0 | `@Positive` |
| Estado | enum ACTIVO/INACTIVO | enum backend |

Expected:
- Frontend previene errores obvios.
- Backend sigue siendo autoridad final.

---

### Task 10: Verificacion Final

**Files:**
- No new files unless failures require fixes.

- [ ] **Step 1: Verificar que no queda data local**

Run:

```bash
cd "/Users/sankef/HERRAMIENTAS DE DESARROLLO/titishop-frontend-angular"
rg -n "localStorage|titishop_|seed|mock|dummy|sample" src/app
```

Expected:
- No hay datos simulados de negocio.
- Si aparece `sessionStorage` para token, debe estar limitado a autenticacion.

- [ ] **Step 2: Verificar normalizacion**

Run:

```bash
cd "/Users/sankef/HERRAMIENTAS DE DESARROLLO/titishop-frontend-angular"
find src/app/features -maxdepth 2 -type d | sort
rg -n "class (Dashboard|Products|Providers|Inventory|Movements|Reports|Users|Settings)|saveProduct|toggleStatus|consultRuc|loadProducts" src/app
```

Expected:
- Carpetas feature de negocio en espanol.
- Metodos de negocio principales en espanol.
- Terminos tecnicos de Angular/TypeScript pueden seguir en ingles.

- [ ] **Step 3: Ejecutar builds y tests**

Run:

```bash
cd "/Users/sankef/HERRAMIENTAS DE DESARROLLO/titishop-backend-springboot"
./mvnw test
./mvnw -DskipTests package

cd "/Users/sankef/HERRAMIENTAS DE DESARROLLO/titishop-frontend-angular"
pnpm build
```

Expected:
- Backend tests pasan.
- Frontend build pasa.
- Warnings existentes quedan listados si no bloquean.

- [ ] **Step 4: QA manual por rutas**

Con backend y frontend corriendo:

```text
https://titishop.proyectoutp.com/panel
https://titishop.proyectoutp.com/productos
https://titishop.proyectoutp.com/proveedores
https://titishop.proyectoutp.com/inventario
https://titishop.proyectoutp.com/movimientos
https://titishop.proyectoutp.com/reportes
https://titishop.proyectoutp.com/usuarios
https://titishop.proyectoutp.com/configuracion
```

Expected por pantalla:
- Loading visible.
- Estado vacio visible.
- Error visible si backend falla.
- Toast o mensaje satisfactorio al guardar/cambiar estado.
- Validacion debajo del input incorrecto.
- Sin errores en consola del navegador.

## Riesgos y Decisiones Pendientes

- Login esta deshabilitado temporalmente: para produccion debe reactivarse con interceptor y guards.
- Los endpoints `DELETE` deben confirmarse como baja logica. Si algun endpoint borra fisicamente, corregir backend antes de conectar UI.
- El rename de carpetas puede ser grande; hacerlo en una fase separada y validar build antes de integrar servicios.
- Si se cambia nombre de archivos `.ts/.html/.scss`, actualizar `templateUrl` y `styleUrl` en cada componente.
- Si backend exige JWT para CRUD, durante QA se debe iniciar sesion o permitir temporalmente solo rutas necesarias en ambiente local.

## Orden Recomendado de Ejecucion

1. Backend contrato y validaciones.
2. Capa HTTP frontend.
3. Normalizacion de carpetas/clases.
4. Productos, categorias y marcas.
5. Proveedores.
6. Inventario y movimientos.
7. Panel, reportes y usuarios.
8. Autenticacion.
9. Validacion cruzada.
10. QA final.
