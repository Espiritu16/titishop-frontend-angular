import { describe, expect, it } from 'vitest';
import { hayCambios, normalizarSnapshot } from './cambios-formulario';

describe('cambios de formulario', () => {
  it('detecta que no hay cambios cuando los valores normalizados son equivalentes', () => {
    const original = normalizarSnapshot({
      nombre: 'Mouse',
      sku: 'SKU-1',
      email: 'ventas@titishop.pe',
      imagenUrl: null,
      precio: 10,
    });
    const actual = normalizarSnapshot({
      nombre: ' Mouse ',
      sku: 'SKU-1',
      email: 'VENTAS@TITISHOP.PE',
      imagenUrl: '',
      precio: 10,
    }, ['email']);

    expect(hayCambios(original, actual)).toBe(false);
  });

  it('detecta cambios reales en campos comparables', () => {
    const original = normalizarSnapshot({ nombre: 'Mouse', stockMinimo: 5 });
    const actual = normalizarSnapshot({ nombre: 'Mouse Pro', stockMinimo: 5 });

    expect(hayCambios(original, actual)).toBe(true);
  });
});
