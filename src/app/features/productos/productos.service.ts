import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../core/http/api-client.service';
import { ActualizarEstadoProductoRequest, ActualizarProductoRequest, ArchivoResponse, CrearProductoRequest, EstadoProducto, PaginaResponse, ProductoResponse } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class ProductosService {
  constructor(private api: ApiClientService) {}

  listar(params?: {
    page?: number;
    size?: number;
    busqueda?: string;
    estado?: EstadoProducto | 'TODOS';
    categoriaId?: string;
    marcaId?: string;
    proveedorId?: string;
  }): Observable<PaginaResponse<ProductoResponse>> {
    return this.api.get<PaginaResponse<ProductoResponse>>('/productos', {
      page: params?.page,
      size: params?.size,
      busqueda: params?.busqueda,
      estado: params?.estado === 'TODOS' ? undefined : params?.estado,
      categoriaId: params?.categoriaId === 'TODOS' ? undefined : params?.categoriaId,
      marcaId: params?.marcaId === 'TODOS' ? undefined : params?.marcaId,
      proveedorId: params?.proveedorId === 'TODOS' ? undefined : params?.proveedorId,
    });
  }

  exportar(formato: 'excel' | 'pdf', params?: {
    busqueda?: string;
    estado?: EstadoProducto | 'TODOS';
    categoriaId?: string;
    marcaId?: string;
    proveedorId?: string;
  }): Observable<Blob> {
    return this.api.getBlob(`/exportaciones/productos/${formato}`, {
      busqueda: params?.busqueda,
      estado: params?.estado === 'TODOS' ? undefined : params?.estado,
      categoriaId: params?.categoriaId === 'TODOS' ? undefined : params?.categoriaId,
      marcaId: params?.marcaId === 'TODOS' ? undefined : params?.marcaId,
      proveedorId: params?.proveedorId === 'TODOS' ? undefined : params?.proveedorId,
    });
  }

  crear(request: CrearProductoRequest): Observable<ProductoResponse> {
    return this.api.post<ProductoResponse, CrearProductoRequest>('/productos', request);
  }

  actualizar(id: string, request: ActualizarProductoRequest): Observable<ProductoResponse> {
    return this.api.put<ProductoResponse, ActualizarProductoRequest>(`/productos/${id}`, request);
  }

  subirImagenProducto(archivo: File): Observable<ArchivoResponse> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    return this.api.postForm<ArchivoResponse>('/archivos/productos', formData);
  }

  actualizarEstado(id: string, estado: EstadoProducto): Observable<ProductoResponse> {
    return this.api.patch<ProductoResponse, ActualizarEstadoProductoRequest>(`/productos/${id}/estado`, { estado });
  }

  inactivar(id: string): Observable<void> {
    return this.api.patch<void, ActualizarEstadoProductoRequest>(`/productos/${id}/estado`, { estado: 'INACTIVO' });
  }
}
