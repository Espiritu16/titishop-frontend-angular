import { EMPTY, Observable, expand, map, reduce } from 'rxjs';
import { PaginaResponse } from './models';

type FechaCreacion = {
  creadoEn?: string;
};

export type FiltroTodos<T extends string> = T | 'TODOS';
export const TAMANO_MAXIMO_PAGINA = 100;
export const TIEMPO_DEBOUNCE_BUSQUEDA_MS = 400;

export interface AccionDebounced {
  schedule(): void;
  destroy(): void;
}

export function crearAccionDebounced(
  action: () => void,
  delayMs = TIEMPO_DEBOUNCE_BUSQUEDA_MS
): AccionDebounced {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const clear = (): void => {
    if (timeoutId === null) return;
    clearTimeout(timeoutId);
    timeoutId = null;
  };

  return {
    schedule(): void {
      clear();
      timeoutId = setTimeout(() => {
        timeoutId = null;
        action();
      }, delayMs);
    },
    destroy(): void {
      clear();
    },
  };
}

export function listarTodasLasPaginas<T>(
  cargarPagina: (page: number, size: number) => Observable<PaginaResponse<T>>,
  size = TAMANO_MAXIMO_PAGINA
): Observable<T[]> {
  return cargarPagina(0, size).pipe(
    expand((pagina) => (pagina.last ? EMPTY : cargarPagina(pagina.page + 1, size))),
    map((pagina) => pagina.content),
    reduce<T[], T[]>((acumulado, content) => [...acumulado, ...content], [])
  );
}

export function ordenarPorCreacionDesc<T extends FechaCreacion>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => fechaEnMs(b.creadoEn) - fechaEnMs(a.creadoEn));
}

export function paginarLocal<T>(items: readonly T[], page: number, size: number): T[] {
  const paginaSegura = Math.max(0, page);
  const tamanoSeguro = Math.max(1, size);
  const inicio = paginaSegura * tamanoSeguro;
  return items.slice(inicio, inicio + tamanoSeguro);
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
