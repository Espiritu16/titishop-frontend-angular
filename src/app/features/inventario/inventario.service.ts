import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../core/http/api-client.service';
import {
  ActualizarInventarioRequest,
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

  crear(request: CrearInventarioRequest): Observable<InventarioResponse> {
    return this.api.post<InventarioResponse, CrearInventarioRequest>('/inventario', request);
  }

  actualizar(id: string, request: ActualizarInventarioRequest): Observable<InventarioResponse> {
    return this.api.put<InventarioResponse, ActualizarInventarioRequest>(`/inventario/${id}`, request);
  }

  inactivar(id: string): Observable<void> {
    return this.api.delete<void>(`/inventario/${id}`);
  }
}
