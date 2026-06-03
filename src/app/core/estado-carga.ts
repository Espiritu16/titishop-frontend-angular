export type EstadoCarga = 'inicial' | 'cargando' | 'exito' | 'error';

export interface ResultadoCarga<T> {
  estado: EstadoCarga;
  datos: T;
  error: string;
}
