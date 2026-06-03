import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../core/http/api-client.service';
import { ActualizarMarcaRequest, CrearMarcaRequest, MarcaResponse } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class MarcasService {
  constructor(private api: ApiClientService) {}

  listar(): Observable<MarcaResponse[]> {
    return this.api.get<MarcaResponse[]>('/marcas');
  }

  crear(request: CrearMarcaRequest): Observable<MarcaResponse> {
    return this.api.post<MarcaResponse, CrearMarcaRequest>('/marcas', request);
  }

  actualizar(id: string, request: ActualizarMarcaRequest): Observable<MarcaResponse> {
    return this.api.put<MarcaResponse, ActualizarMarcaRequest>(`/marcas/${id}`, request);
  }

  inactivar(id: string): Observable<void> {
    return this.api.delete<void>(`/marcas/${id}`);
  }
}
