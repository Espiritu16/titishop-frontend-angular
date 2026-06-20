import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../core/http/api-client.service';
import {
  ActualizarUsuarioRequest,
  CrearUsuarioRequest,
  EstadoCatalogo,
  PaginaResponse,
  RolUsuario,
  UsuarioResponse,
} from '../../core/models';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  constructor(private api: ApiClientService) {}

  listar(params?: {
    page?: number;
    size?: number;
    busqueda?: string;
    rol?: RolUsuario | 'TODOS';
    estado?: EstadoCatalogo | 'TODOS';
  }): Observable<PaginaResponse<UsuarioResponse>> {
    return this.api.get<PaginaResponse<UsuarioResponse>>('/usuarios', {
      page: params?.page,
      size: params?.size,
      busqueda: params?.busqueda,
      rol: params?.rol === 'TODOS' ? undefined : params?.rol,
      estado: params?.estado === 'TODOS' ? undefined : params?.estado,
    });
  }

  crear(request: CrearUsuarioRequest): Observable<UsuarioResponse> {
    return this.api.post<UsuarioResponse, CrearUsuarioRequest>('/usuarios', request);
  }

  actualizar(id: string, request: ActualizarUsuarioRequest): Observable<UsuarioResponse> {
    return this.api.put<UsuarioResponse, ActualizarUsuarioRequest>(`/usuarios/${id}`, request);
  }

  inactivar(id: string): Observable<void> {
    return this.api.delete<void>(`/usuarios/${id}`);
  }
}
