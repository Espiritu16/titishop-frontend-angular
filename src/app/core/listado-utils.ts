type FechaCreacion = {
  creadoEn?: string;
};

export type FiltroTodos<T extends string> = T | 'TODOS';

export function ordenarPorCreacionDesc<T extends FechaCreacion>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => fechaEnMs(b.creadoEn) - fechaEnMs(a.creadoEn));
}

export function buscarEnCampos<T extends object>(
  item: T,
  busqueda: string,
  campos: readonly (keyof T)[]
): boolean {
  const termino = normalizarBusqueda(busqueda);
  if (!termino) return true;

  return campos.some((campo) => normalizarBusqueda(item[campo]).includes(termino));
}

export function coincideFiltro<T extends string>(valor: T, filtro: FiltroTodos<T>): boolean {
  return filtro === 'TODOS' || valor === filtro;
}

export function normalizarBusqueda(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function fechaEnMs(value?: string): number {
  if (!value) return 0;
  const fecha = Date.parse(value);
  return Number.isNaN(fecha) ? 0 : fecha;
}
