import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { ApiClientService } from '../../core/http/api-client.service';
import { ProductosService } from './productos.service';

class ApiClientStub {
  lastParams: Record<string, unknown> | undefined;

  get<T>(_path: string, params?: Record<string, unknown>) {
    this.lastParams = params;
    return of({ content: [], page: 0, size: 10, totalElements: 0, totalPages: 0, first: true, last: true, empty: true } as T);
  }

  getBlob(_path: string, params?: Record<string, unknown>) {
    this.lastParams = params;
    return of(new Blob());
  }
}

describe('ProductosService', () => {
  it('envia proveedorId al listar productos', () => {
    const api = new ApiClientStub();
    const service = new ProductosService(api as unknown as ApiClientService);

    service.listar({ proveedorId: 'prov-1' }).subscribe();

    expect(api.lastParams?.['proveedorId']).toBe('prov-1');
  });

  it('omite proveedorId TODOS en exportacion', () => {
    const api = new ApiClientStub();
    const service = new ProductosService(api as unknown as ApiClientService);

    service.exportar('pdf', { proveedorId: 'TODOS' }).subscribe();

    expect(api.lastParams?.['proveedorId']).toBeUndefined();
  });
});
