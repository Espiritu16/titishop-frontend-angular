import { describe, expect, it } from 'vitest';
import { buscarEnCampos, coincideFiltro, ordenarPorCreacionDesc } from './listado-utils';

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
});
