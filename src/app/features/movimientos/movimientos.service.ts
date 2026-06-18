import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../core/http/api-client.service';
import {
  AnularMovimientoRequest,
  MovimientoResponse,
  PaginaResponse,
  RegistrarMovimientoRequest,
  TipoMovimiento,
} from '../../core/models';

@Injectable({ providedIn: 'root' })
export class MovimientosService {
  constructor(private api: ApiClientService) {}

  listar(params?: {
    page?: number;
    size?: number;
    busqueda?: string;
    tipo?: TipoMovimiento | 'TODOS';
    anulado?: boolean;
  }): Observable<PaginaResponse<MovimientoResponse>> {
    return this.api.get<PaginaResponse<MovimientoResponse>>('/movimientos', {
      page: params?.page,
      size: params?.size,
      busqueda: params?.busqueda,
      tipo: params?.tipo === 'TODOS' ? undefined : params?.tipo,
      anulado: params?.anulado,
    });
  }

  registrar(request: RegistrarMovimientoRequest): Observable<MovimientoResponse> {
    return this.api.post<MovimientoResponse, RegistrarMovimientoRequest>('/movimientos', request);
  }

  anular(id: string, request: AnularMovimientoRequest): Observable<void> {
    return this.api.post<void, AnularMovimientoRequest>(`/movimientos/${id}/anulacion`, request);
  }
}
