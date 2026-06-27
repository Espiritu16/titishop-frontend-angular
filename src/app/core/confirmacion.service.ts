import { Injectable, signal } from '@angular/core';

export type TonoConfirmacion = 'normal' | 'danger';

export interface ConfirmacionOpciones {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  tono?: TonoConfirmacion;
}

export interface ConfirmacionEstado extends Required<ConfirmacionOpciones> {}

@Injectable({ providedIn: 'root' })
export class ConfirmacionService {
  readonly estado = signal<ConfirmacionEstado | null>(null);
  private resolver: ((value: boolean) => void) | null = null;

  confirmar(opciones: ConfirmacionOpciones): Promise<boolean> {
    this.resolver?.(false);
    this.estado.set({
      titulo: opciones.titulo,
      mensaje: opciones.mensaje,
      textoConfirmar: opciones.textoConfirmar ?? 'Confirmar',
      textoCancelar: opciones.textoCancelar ?? 'Cancelar',
      tono: opciones.tono ?? 'normal',
    });

    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
    });
  }

  aceptar(): void {
    this.resolverActual(true);
  }

  cancelar(): void {
    this.resolverActual(false);
  }

  private resolverActual(value: boolean): void {
    const resolver = this.resolver;
    this.resolver = null;
    this.estado.set(null);
    resolver?.(value);
  }
}
