export type RolUsuario = 'ADMINISTRADOR' | 'ALMACENERO' | 'SUPERVISOR';
export type EstadoCatalogo = 'ACTIVO' | 'INACTIVO';
export type TipoMovimiento = 'ENTRADA' | 'SALIDA' | 'AJUSTE';
export type EstadoInventario = 'ACTIVO' | 'INACTIVO';
export type EstadoProveedor = 'ACTIVO' | 'INACTIVO';
export type EstadoProducto = 'ACTIVO' | 'INACTIVO';

export type Role = RolUsuario;
export type CatalogStatus = EstadoCatalogo;
export type MovementType = TipoMovimiento;

export interface SessionUser {
  id?: string;
  fullName: string;
  email: string;
  role: RolUsuario;
  loginAt: string;
  expiresAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tipo: 'Bearer' | string;
  expiraEn: string;
  usuarioId: string;
  nombreCompleto: string;
  email: string;
  rol: RolUsuario;
}

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  details: string[];
}

export interface CategoriaResponse {
  id: string;
  nombre: string;
  estado: EstadoCatalogo;
  creadoEn?: string;
  actualizadoEn?: string | null;
}

export interface CrearCategoriaRequest {
  nombre: string;
}

export interface ActualizarCategoriaRequest {
  nombre: string;
  estado: EstadoCatalogo;
}

export interface MarcaResponse {
  id: string;
  nombre: string;
  estado: EstadoCatalogo;
  creadoEn?: string;
  actualizadoEn?: string | null;
}

export interface CrearMarcaRequest {
  nombre: string;
}

export interface ActualizarMarcaRequest {
  nombre: string;
  estado: EstadoCatalogo;
}

export interface ProductoResponse {
  id: string;
  sku: string;
  nombre: string;
  descripcion: string;
  imagenUrl: string;
  categoriaId: string;
  categoriaNombre: string;
  marcaId: string;
  marcaNombre: string;
  precioCompra: number;
  precioVenta: number;
  estado: EstadoProducto;
  creadoEn?: string;
  actualizadoEn?: string | null;
}

export interface CrearProductoRequest {
  nombre: string;
  sku: string;
  descripcion: string;
  imagenUrl?: string | null;
  categoriaId: string;
  marcaId: string;
  precioCompra: number;
  precioVenta: number;
}

export interface ActualizarProductoRequest extends CrearProductoRequest {
  estado: EstadoProducto;
}

export interface ArchivoResponse {
  url: string;
  ruta: string;
  nombreOriginal: string;
  contentType: string;
  size: number;
}

export interface ProveedorResponse {
  id: string;
  ruc: string;
  razonSocial: string;
  celular?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion: string;
  estado: EstadoProveedor;
  creadoEn?: string;
  actualizadoEn?: string | null;
}

export interface CrearProveedorRequest {
  razonSocial: string;
  ruc: string;
  celular?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion: string;
}

export interface ActualizarProveedorRequest extends CrearProveedorRequest {
  estado: EstadoProveedor;
}

export interface ConsultaRucProveedorResponse {
  ruc: string;
  razonSocial: string;
  direccion: string;
  direccionCompleta: string;
  departamento: string;
  provincia: string;
  distrito: string;
  estadoContribuyente: string;
  condicionContribuyente: string;
}

export interface InventarioResponse {
  id: string;
  productoId: string;
  productoSku: string;
  productoNombre: string;
  stockActual: number;
  stockMinimo: number;
  ubicacion: string;
  estado: EstadoInventario;
  stockCritico: boolean;
  creadoEn?: string;
  actualizadoEn?: string | null;
}

export interface CrearInventarioRequest {
  productoId: string;
  stockActual: number;
  stockMinimo: number;
  ubicacion: string;
}

export interface ActualizarInventarioRequest {
  stockMinimo: number;
  ubicacion: string;
  estado: EstadoInventario;
}

export interface MovimientoResponse {
  id: string;
  tipo: TipoMovimiento;
  productoId: string;
  productoSku: string;
  productoNombre: string;
  proveedorId?: string;
  proveedorRazonSocial?: string | null;
  cantidad: number;
  motivo: string;
  stockAntes: number;
  stockDespues: number;
  creadoPorId: string;
  creadoPorNombre: string;
  creadoEn: string;
  anuladoEn?: string | null;
  anuladoPorId?: string | null;
  motivoAnulacion?: string | null;
}

export interface RegistrarMovimientoRequest {
  productoId: string;
  proveedorId?: string | null;
  usuarioId: string;
  tipo: TipoMovimiento;
  cantidad?: number | null;
  stockDestino?: number | null;
  motivo: string;
}

export interface AnularMovimientoRequest {
  usuarioId: string;
  motivoAnulacion: string;
}

export interface UsuarioResponse {
  id: string;
  nombreCompleto: string;
  email: string;
  rol: RolUsuario;
  estado: EstadoCatalogo;
  creadoEn?: string;
  actualizadoEn?: string | null;
}

export interface CrearUsuarioRequest {
  nombreCompleto: string;
  email: string;
  password: string;
  rol: RolUsuario;
}

export interface ActualizarUsuarioRequest {
  nombreCompleto: string;
  email: string;
  password?: string | null;
  rol: RolUsuario;
  estado: EstadoCatalogo;
}

export interface PanelResumenResponse {
  totalProductosActivos: number;
  totalProveedoresActivos: number;
  productosStockCritico: number;
  movimientosDelDia: number;
  entradasDelMes: number;
  salidasDelMes: number;
  valorEstimadoInventario: number;
  ultimosMovimientos: PanelUltimoMovimientoResponse[];
}

export interface PanelUltimoMovimientoResponse {
  id: string;
  fecha: string;
  tipo: TipoMovimiento;
  productoNombre: string;
  productoSku: string;
  cantidad: number;
  creadoPorNombre: string;
}

export interface ReporteMovimientosRequest {
  fechaInicio?: string | null;
  fechaFin?: string | null;
  productoId?: string | null;
  proveedorId?: string | null;
  tipo?: TipoMovimiento | null;
  incluirAnulados?: boolean;
}

export interface ReporteMovimientosResponse {
  id: string;
  fecha: string;
  productoId: string;
  productoNombre: string;
  productoSku: string;
  proveedorId?: string | null;
  proveedorRazonSocial?: string | null;
  tipo: TipoMovimiento;
  cantidad: number;
  stockAntes: number;
  stockDespues: number;
  motivo: string;
  creadoPorId: string;
  creadoPorNombre: string;
  anulado: boolean;
}

export interface ReporteStockResponse {
  productoId: string;
  productoNombre: string;
  productoSku: string;
  categoriaId: string;
  categoriaNombre: string;
  marcaId: string;
  marcaNombre: string;
  stockActual: number;
  stockMinimo: number;
  ubicacion: string;
  estado: EstadoInventario;
  stockCritico: boolean;
}

export interface ReporteStockCriticoResponse {
  productoId: string;
  productoNombre: string;
  productoSku: string;
  stockActual: number;
  stockMinimo: number;
  cantidadSugerida: number;
  ubicacion: string;
}

export interface ReporteValorizacionItemResponse {
  productoId: string;
  productoNombre: string;
  productoSku: string;
  stockActual: number;
  precioCompra: number;
  precioVenta: number;
  valorCosto: number;
  valorVenta: number;
  margenEstimado: number;
}

export interface ReporteValorizacionResponse {
  items: ReporteValorizacionItemResponse[];
  valorCostoTotal: number;
  valorVentaTotal: number;
  margenEstimadoTotal: number;
}

export type CategoryResponse = CategoriaResponse;
export type BrandResponse = MarcaResponse;
export type ProductResponse = ProductoResponse;
export type ProviderResponse = ProveedorResponse;
export type ProviderRucLookupResponse = ConsultaRucProveedorResponse;
export type InventoryResponse = InventarioResponse;
export type MovementResponse = MovimientoResponse;
export type UserResponse = UsuarioResponse;
export type PanelSummaryResponse = PanelResumenResponse;
export type PanelLastMovementResponse = PanelUltimoMovimientoResponse;
