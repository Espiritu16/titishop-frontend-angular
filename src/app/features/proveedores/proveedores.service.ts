import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../core/http/api-client.service';
import {
  ActualizarProveedorRequest,
  ActualizarEstadoProveedorRequest,
  ConsultaRucProveedorResponse,
  CrearProveedorRequest,
  EstadoProveedor,
  PaginaResponse,
  ProveedorResponse,
} from '../../core/models';

@Injectable({ providedIn: 'root' })
export class ProveedoresService {
  constructor(private api: ApiClientService) {}

  listar(params?: {
    page?: number;
    size?: number;
    busqueda?: string;
    estado?: EstadoProveedor | 'TODOS';
  }): Observable<PaginaResponse<ProveedorResponse>> {
    return this.api.get<PaginaResponse<ProveedorResponse>>('/proveedores', {
      page: params?.page,
      size: params?.size,
      busqueda: params?.busqueda,
      estado: params?.estado === 'TODOS' ? undefined : params?.estado,
    });
  }

  consultarRuc(ruc: string): Observable<ConsultaRucProveedorResponse> {
    return this.api.get<ConsultaRucProveedorResponse>(`/proveedores/consulta-ruc/${ruc}`);
  }

  crear(request: CrearProveedorRequest): Observable<ProveedorResponse> {
    return this.api.post<ProveedorResponse, CrearProveedorRequest>('/proveedores', request);
  }

  actualizar(id: string, request: ActualizarProveedorRequest): Observable<ProveedorResponse> {
    return this.api.put<ProveedorResponse, ActualizarProveedorRequest>(`/proveedores/${id}`, request);
  }

  actualizarEstado(id: string, estado: EstadoProveedor): Observable<ProveedorResponse> {
    return this.api.patch<ProveedorResponse, ActualizarEstadoProveedorRequest>(`/proveedores/${id}/estado`, { estado });
  }

  inactivar(id: string): Observable<void> {
    return this.api.patch<void, ActualizarEstadoProveedorRequest>(`/proveedores/${id}/estado`, { estado: 'INACTIVO' });
  }
}
