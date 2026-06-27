import { afterEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';
import { PaginaResponse } from './models';
import {
  buscarEnCampos,
  coincideFiltro,
  crearAccionDebounced,
  listarTodasLasPaginas,
  ordenarPorCreacionDesc,
  paginarLocal,
  TIEMPO_DEBOUNCE_BUSQUEDA_MS,
} from './listado-utils';

describe('utilidades de listado', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

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

  it('pagina arreglos locales manteniendo limites seguros', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];

    expect(paginarLocal(items, 0, 2)).toEqual(['a', 'b']);
    expect(paginarLocal(items, 1, 2)).toEqual(['c', 'd']);
    expect(paginarLocal(items, 2, 2)).toEqual(['e']);
    expect(paginarLocal(items, -1, 2)).toEqual(['a', 'b']);
    expect(paginarLocal(items, 99, 2)).toEqual([]);
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

  it('ejecuta una busqueda solo cuando termina el debounce', () => {
    vi.useFakeTimers();
    const accion = vi.fn();
    const debounced = crearAccionDebounced(accion);

    debounced.schedule();
    debounced.schedule();
    debounced.schedule();

    vi.advanceTimersByTime(TIEMPO_DEBOUNCE_BUSQUEDA_MS - 1);
    expect(accion).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(accion).toHaveBeenCalledTimes(1);
  });

  it('cancela una busqueda pendiente cuando se destruye el debounce', () => {
    vi.useFakeTimers();
    const accion = vi.fn();
    const debounced = crearAccionDebounced(accion);

    debounced.schedule();
    debounced.destroy();
    vi.advanceTimersByTime(TIEMPO_DEBOUNCE_BUSQUEDA_MS);

    expect(accion).not.toHaveBeenCalled();
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
