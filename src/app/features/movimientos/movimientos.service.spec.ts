import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { ApiClientService } from '../../core/http/api-client.service';
import { MovimientosService } from './movimientos.service';

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

describe('MovimientosService', () => {
  it('envia productoId al listar historial de producto', () => {
    const api = new ApiClientStub();
    const service = new MovimientosService(api as unknown as ApiClientService);

    service.listar({ productoId: 'prod-1' }).subscribe();

    expect(api.lastParams?.['productoId']).toBe('prod-1');
  });

  it('envia productoId al exportar historial de producto', () => {
    const api = new ApiClientStub();
    const service = new MovimientosService(api as unknown as ApiClientService);

    service.exportar('excel', { productoId: 'prod-1' }).subscribe();

    expect(api.lastParams?.['productoId']).toBe('prod-1');
  });
});
