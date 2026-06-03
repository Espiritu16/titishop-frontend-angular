import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../core/http/api-client.service';
import {
  ActualizarCategoriaRequest,
  CategoriaResponse,
  CrearCategoriaRequest,
} from '../../core/models';

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

  inactivar(id: string): Observable<void> {
    return this.api.delete<void>(`/categorias/${id}`);
  }
}
