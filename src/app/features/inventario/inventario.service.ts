import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../core/http/api-client.service';
import {
  ActualizarInventarioRequest,
  ActualizarEstadoInventarioRequest,
  CrearInventarioRequest,
  EstadoInventario,
  EstadoStockInventario,
  InventarioResponse,
  PaginaResponse,
} from '../../core/models';

@Injectable({ providedIn: 'root' })
export class InventarioService {
  constructor(private api: ApiClientService) {}

  listar(params?: {
    page?: number;
    size?: number;
    busqueda?: string;
    estado?: EstadoInventario | 'TODOS';
    stockEstado?: EstadoStockInventario | 'TODOS';
  }): Observable<PaginaResponse<InventarioResponse>> {
    return this.api.get<PaginaResponse<InventarioResponse>>('/inventario', {
      page: params?.page,
      size: params?.size,
      busqueda: params?.busqueda,
      estado: params?.estado === 'TODOS' ? undefined : params?.estado,
      stockEstado: params?.stockEstado === 'TODOS' ? undefined : params?.stockEstado,
    });
  }

  exportar(formato: 'excel' | 'pdf', params?: {
    busqueda?: string;
    estado?: EstadoInventario | 'TODOS';
    stockEstado?: EstadoStockInventario | 'TODOS';
  }): Observable<Blob> {
    return this.api.getBlob(`/exportaciones/inventario/${formato}`, {
      busqueda: params?.busqueda,
      estado: params?.estado === 'TODOS' ? undefined : params?.estado,
      stockEstado: params?.stockEstado === 'TODOS' ? undefined : params?.stockEstado,
    });
  }

  crear(request: CrearInventarioRequest): Observable<InventarioResponse> {
    return this.api.post<InventarioResponse, CrearInventarioRequest>('/inventario', request);
  }

  actualizar(id: string, request: ActualizarInventarioRequest): Observable<InventarioResponse> {
    return this.api.put<InventarioResponse, ActualizarInventarioRequest>(`/inventario/${id}`, request);
  }

  actualizarEstado(id: string, estado: EstadoInventario): Observable<InventarioResponse> {
    return this.api.patch<InventarioResponse, ActualizarEstadoInventarioRequest>(`/inventario/${id}/estado`, { estado });
  }

  inactivar(id: string): Observable<void> {
    return this.api.patch<void, ActualizarEstadoInventarioRequest>(`/inventario/${id}/estado`, { estado: 'INACTIVO' });
  }
}
