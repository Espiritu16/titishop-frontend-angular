import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../core/http/api-client.service';
import {
  AnularMovimientoRequest,
  MovimientoResponse,
  RegistrarMovimientoRequest,
} from '../../core/models';

@Injectable({ providedIn: 'root' })
export class MovimientosService {
  constructor(private api: ApiClientService) {}

  listar(): Observable<MovimientoResponse[]> {
    return this.api.get<MovimientoResponse[]>('/movimientos');
  }

  registrar(request: RegistrarMovimientoRequest): Observable<MovimientoResponse> {
    return this.api.post<MovimientoResponse, RegistrarMovimientoRequest>('/movimientos', request);
  }

  anular(id: string, request: AnularMovimientoRequest): Observable<void> {
    return this.api.post<void, AnularMovimientoRequest>(`/movimientos/${id}/anulacion`, request);
  }
}
