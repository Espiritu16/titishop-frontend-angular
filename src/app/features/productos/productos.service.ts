import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../core/http/api-client.service';
import { ActualizarProductoRequest, ArchivoResponse, CrearProductoRequest, ProductoResponse } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class ProductosService {
  constructor(private api: ApiClientService) {}

  listar(): Observable<ProductoResponse[]> {
    return this.api.get<ProductoResponse[]>('/productos');
  }

  crear(request: CrearProductoRequest): Observable<ProductoResponse> {
    return this.api.post<ProductoResponse, CrearProductoRequest>('/productos', request);
  }

  actualizar(id: string, request: ActualizarProductoRequest): Observable<ProductoResponse> {
    return this.api.put<ProductoResponse, ActualizarProductoRequest>(`/productos/${id}`, request);
  }

  subirImagenProducto(archivo: File): Observable<ArchivoResponse> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    return this.api.postForm<ArchivoResponse>('/archivos/productos', formData);
  }

  inactivar(id: string): Observable<void> {
    return this.api.delete<void>(`/productos/${id}`);
  }
}
