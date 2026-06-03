import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../core/http/api-client.service';
import {
  ActualizarInventarioRequest,
  CrearInventarioRequest,
  InventarioResponse,
} from '../../core/models';

@Injectable({ providedIn: 'root' })
export class InventarioService {
  constructor(private api: ApiClientService) {}

  listar(): Observable<InventarioResponse[]> {
    return this.api.get<InventarioResponse[]>('/inventario');
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
