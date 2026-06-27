import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../core/http/api-client.service';
import {
  ActualizarCategoriaRequest,
  ActualizarEstadoCatalogoRequest,
  CategoriaResponse,
  CrearCategoriaRequest,
  EstadoCatalogo,
  PaginaResponse,
} from '../../core/models';

@Injectable({ providedIn: 'root' })
export class CategoriasService {
  constructor(private api: ApiClientService) {}

  listar(params?: {
    page?: number;
    size?: number;
    busqueda?: string;
    estado?: EstadoCatalogo | 'TODOS';
  }): Observable<PaginaResponse<CategoriaResponse>> {
    return this.api.get<PaginaResponse<CategoriaResponse>>('/categorias', {
      page: params?.page,
      size: params?.size,
      busqueda: params?.busqueda,
      estado: params?.estado === 'TODOS' ? undefined : params?.estado,
    });
  }

  crear(request: CrearCategoriaRequest): Observable<CategoriaResponse> {
    return this.api.post<CategoriaResponse, CrearCategoriaRequest>('/categorias', request);
  }

  actualizar(id: string, request: ActualizarCategoriaRequest): Observable<CategoriaResponse> {
    return this.api.put<CategoriaResponse, ActualizarCategoriaRequest>(`/categorias/${id}`, request);
  }

  actualizarEstado(id: string, estado: EstadoCatalogo): Observable<CategoriaResponse> {
    return this.api.patch<CategoriaResponse, ActualizarEstadoCatalogoRequest>(`/categorias/${id}/estado`, { estado });
  }

  inactivar(id: string): Observable<void> {
    return this.api.patch<void, ActualizarEstadoCatalogoRequest>(`/categorias/${id}/estado`, { estado: 'INACTIVO' });
  }
}
