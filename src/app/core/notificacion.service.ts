import { Injectable, signal } from '@angular/core';

export type TipoNotificacion = 'success' | 'error' | 'info';

export interface NotificacionEstado {
  tipo: TipoNotificacion;
  mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class NotificacionService {
  readonly estado = signal<NotificacionEstado | null>(null);
  private timer: ReturnType<typeof setTimeout> | null = null;

  success(mensaje: string): void {
    this.mostrar(mensaje, 'success');
  }

  error(mensaje: string): void {
    this.mostrar(mensaje, 'error', 5000);
  }

  info(mensaje: string): void {
    this.mostrar(mensaje, 'info');
  }

  cerrar(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.estado.set(null);
  }

  private mostrar(mensaje: string, tipo: TipoNotificacion, duracion = 3500): void {
    if (this.timer) clearTimeout(this.timer);
    this.estado.set({ mensaje, tipo });
    this.timer = setTimeout(() => this.cerrar(), duracion);
  }
}
