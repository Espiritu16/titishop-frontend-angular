import { describe, expect, it } from 'vitest';
import { of } from 'rxjs';
import { PaginaResponse } from './models';
import { buscarEnCampos, coincideFiltro, listarTodasLasPaginas, ordenarPorCreacionDesc } from './listado-utils';

describe('utilidades de listado', () => {
  it('ordena primero los registros creados mas recientemente', () => {
    const items = [
      { id: 'antiguo', creadoEn: '2026-01-05T10:00:00Z' },
      { id: 'nuevo', creadoEn: '2026-06-01T10:00:00Z' },
      { id: 'intermedio', creadoEn: '2026-03-10T10:00:00Z' },
    ];

    expect(ordenarPorCreacionDesc(items).map((item) => item.id)).toEqual([
      'nuevo',
      'intermedio',
      'antiguo',
    ]);
  });

  it('busca texto ignorando mayusculas, espacios repetidos y acentos', () => {
    const producto = {
      nombre: 'Café Premium',
      sku: 'TITI-CAF-01',
      categoria: 'Bebidas',
    };

    expect(buscarEnCampos(producto, ' cafe   pre ', ['nombre', 'sku', 'categoria'])).toBe(true);
  });

  it('considera TODOS como filtro abierto y compara valores concretos', () => {
    expect(coincideFiltro('ACTIVO', 'TODOS')).toBe(true);
    expect(coincideFiltro('ACTIVO', 'ACTIVO')).toBe(true);
    expect(coincideFiltro('INACTIVO', 'ACTIVO')).toBe(false);
  });

  it('carga todas las páginas usando el tamaño máximo permitido por el backend', async () => {
    const llamadas: Array<{ page: number; size: number }> = [];
    const paginas: PaginaResponse<string>[] = [
      pagina(['categoria-1', 'categoria-2'], 0, 2, false),
      pagina(['categoria-3'], 1, 2, true),
    ];

    const resultado = await new Promise<string[]>((resolve, reject) => {
      listarTodasLasPaginas((page, size) => {
        llamadas.push({ page, size });
        return of(paginas[page]);
      }).subscribe({ next: resolve, error: reject });
    });

    expect(resultado).toEqual(['categoria-1', 'categoria-2', 'categoria-3']);
    expect(llamadas).toEqual([
      { page: 0, size: 100 },
      { page: 1, size: 100 },
    ]);
  });
});

function pagina<T>(content: T[], page: number, totalPages: number, last: boolean): PaginaResponse<T> {
  return {
    content,
    page,
    size: 100,
    totalElements: content.length,
    totalPages,
    first: page === 0,
    last,
    empty: content.length === 0,
  };
}
