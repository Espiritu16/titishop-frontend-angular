import { describe, expect, it } from 'vitest';
import { ConfirmacionService } from './confirmacion.service';

describe('ConfirmacionService', () => {
  it('abre una confirmacion y resuelve true al aceptar', async () => {
    const service = new ConfirmacionService();

    const resultado = service.confirmar({
      titulo: 'Desactivar producto',
      mensaje: 'Esta accion cambiara el estado del producto.',
      textoConfirmar: 'Desactivar',
    });

    expect(service.estado()?.titulo).toBe('Desactivar producto');
    service.aceptar();

    await expect(resultado).resolves.toBe(true);
    expect(service.estado()).toBeNull();
  });

  it('resuelve false al cancelar', async () => {
    const service = new ConfirmacionService();

    const resultado = service.confirmar({
      titulo: 'Cerrar sesion',
      mensaje: 'Se cerrara la sesion actual.',
    });

    service.cancelar();

    await expect(resultado).resolves.toBe(false);
    expect(service.estado()).toBeNull();
  });
});
