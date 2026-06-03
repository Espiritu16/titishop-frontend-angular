import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../core/http/api-client.service';
import {
  ActualizarProveedorRequest,
  ConsultaRucProveedorResponse,
  CrearProveedorRequest,
  ProveedorResponse,
} from '../../core/models';

@Injectable({ providedIn: 'root' })
export class ProveedoresService {
  constructor(private api: ApiClientService) {}

  listar(): Observable<ProveedorResponse[]> {
    return this.api.get<ProveedorResponse[]>('/proveedores');
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

  inactivar(id: string): Observable<void> {
    return this.api.delete<void>(`/proveedores/${id}`);
  }
}
