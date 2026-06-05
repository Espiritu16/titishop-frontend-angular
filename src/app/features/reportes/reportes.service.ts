import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../core/http/api-client.service';
import {
  EstadoInventario,
  ReporteMovimientosRequest,
  ReporteMovimientosResponse,
  ReporteStockCriticoResponse,
  ReporteStockResponse,
  ReporteValorizacionResponse,
} from '../../core/models';

@Injectable({ providedIn: 'root' })
export class ReportesService {
  constructor(private api: ApiClientService) {}

  movimientos(filtros: ReporteMovimientosRequest): Observable<ReporteMovimientosResponse[]> {
    return this.api.get<ReporteMovimientosResponse[]>(`/reportes/movimientos${this.toQuery(filtros)}`);
  }

  stock(filtros: {
    estado?: EstadoInventario | null;
    categoriaId?: string | null;
    marcaId?: string | null;
    busqueda?: string | null;
  }): Observable<ReporteStockResponse[]> {
    return this.api.get<ReporteStockResponse[]>(`/reportes/stock${this.toQuery(filtros)}`);
  }

  stockCritico(): Observable<ReporteStockCriticoResponse[]> {
    return this.api.get<ReporteStockCriticoResponse[]>('/reportes/stock-critico');
  }

  valorizacion(): Observable<ReporteValorizacionResponse> {
    return this.api.get<ReporteValorizacionResponse>('/reportes/valorizacion');
  }

  private toQuery(values: object): string {
    let params = new HttpParams();
    Object.entries(values).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') return;
      params = params.set(key, String(value));
    });
    const query = params.toString();
    return query ? `?${query}` : '';
  }
}
