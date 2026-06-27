import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../core/http/api-client.service';
import { ActualizarEstadoCatalogoRequest, ActualizarMarcaRequest, CrearMarcaRequest, EstadoCatalogo, MarcaResponse, PaginaResponse } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class MarcasService {
  constructor(private api: ApiClientService) {}

  listar(params?: {
    page?: number;
    size?: number;
    busqueda?: string;
    estado?: EstadoCatalogo | 'TODOS';
  }): Observable<PaginaResponse<MarcaResponse>> {
    return this.api.get<PaginaResponse<MarcaResponse>>('/marcas', {
      page: params?.page,
      size: params?.size,
      busqueda: params?.busqueda,
      estado: params?.estado === 'TODOS' ? undefined : params?.estado,
    });
  }

  crear(request: CrearMarcaRequest): Observable<MarcaResponse> {
    return this.api.post<MarcaResponse, CrearMarcaRequest>('/marcas', request);
  }

  actualizar(id: string, request: ActualizarMarcaRequest): Observable<MarcaResponse> {
    return this.api.put<MarcaResponse, ActualizarMarcaRequest>(`/marcas/${id}`, request);
  }

  actualizarEstado(id: string, estado: EstadoCatalogo): Observable<MarcaResponse> {
    return this.api.patch<MarcaResponse, ActualizarEstadoCatalogoRequest>(`/marcas/${id}/estado`, { estado });
  }

  inactivar(id: string): Observable<void> {
    return this.api.patch<void, ActualizarEstadoCatalogoRequest>(`/marcas/${id}/estado`, { estado: 'INACTIVO' });
  }
}
