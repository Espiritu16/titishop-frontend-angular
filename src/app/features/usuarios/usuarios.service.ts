import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../core/http/api-client.service';
import {
  ActualizarUsuarioRequest,
  CrearUsuarioRequest,
  UsuarioResponse,
} from '../../core/models';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  constructor(private api: ApiClientService) {}

  listar(): Observable<UsuarioResponse[]> {
    return this.api.get<UsuarioResponse[]>('/usuarios');
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
