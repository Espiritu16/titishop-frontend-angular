import { TipoMovimiento } from './models';

export const MOVIMIENTO_STOCK_MAXIMO = 1000;

export function calcularStockFinalMovimiento(
  tipo: TipoMovimiento,
  stockActual: number,
  cantidad: number,
  stockDestino: number
): number {
  if (tipo === 'ENTRADA') return stockActual + cantidad;
  if (tipo === 'SALIDA') return stockActual - cantidad;
  return stockDestino;
}

export function diferenciaAjusteMovimiento(stockActual: number, stockDestino: number): number {
  return Math.abs(stockDestino - stockActual);
}

export function estaEnRangoMovimiento(value: number): boolean {
  return Number.isFinite(value) && value >= 1 && value <= MOVIMIENTO_STOCK_MAXIMO;
}

export function salidaSuperaStock(stockActual: number, cantidad: number): boolean {
  return cantidad > stockActual;
}
