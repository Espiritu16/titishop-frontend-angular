import { describe, expect, it } from 'vitest';
import {
  calcularStockFinalMovimiento,
  diferenciaAjusteMovimiento,
  estaEnRangoMovimiento,
  MOVIMIENTO_STOCK_MAXIMO,
  salidaSuperaStock,
} from './movimiento-stock';

describe('calculos de stock para movimientos', () => {
  it('suma la cantidad al stock actual en entradas', () => {
    expect(calcularStockFinalMovimiento('ENTRADA', 12, 5, 0)).toBe(17);
  });

  it('resta la cantidad al stock actual en salidas', () => {
    expect(calcularStockFinalMovimiento('SALIDA', 12, 5, 0)).toBe(7);
  });

  it('usa el stock destino como stock final en ajustes', () => {
    expect(calcularStockFinalMovimiento('AJUSTE', 12, 5, 20)).toBe(20);
  });

  it('calcula la diferencia absoluta de un ajuste', () => {
    expect(diferenciaAjusteMovimiento(12, 20)).toBe(8);
    expect(diferenciaAjusteMovimiento(20, 12)).toBe(8);
  });

  it('valida que el valor operativo este entre 1 y 1000', () => {
    expect(MOVIMIENTO_STOCK_MAXIMO).toBe(1000);
    expect(estaEnRangoMovimiento(1)).toBe(true);
    expect(estaEnRangoMovimiento(1000)).toBe(true);
    expect(estaEnRangoMovimiento(0)).toBe(false);
    expect(estaEnRangoMovimiento(1001)).toBe(false);
  });

  it('detecta salidas mayores al stock actual', () => {
    expect(salidaSuperaStock(5, 4)).toBe(false);
    expect(salidaSuperaStock(5, 6)).toBe(true);
  });
});
