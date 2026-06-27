import { describe, expect, it, vi } from 'vitest';
import { ConfirmacionService } from '../../../core/confirmacion.service';
import { NotificacionService } from '../../../core/notificacion.service';
import { AppShell } from './app-shell';

describe('AppShell', () => {
  it('confirma el modal abierto al presionar Enter', async () => {
    const confirmacion = new ConfirmacionService();
    const shell = new AppShell(
      { session: () => ({ fullName: 'Kevin', role: 'ADMINISTRADOR' }), logout: vi.fn() } as never,
      { isDark: false, toggle: vi.fn() } as never,
      confirmacion,
      new NotificacionService()
    );

    const resultado = confirmacion.confirmar({
      titulo: 'Activar producto',
      mensaje: 'Se activara el producto seleccionado.',
    });

    shell.confirmarConEnter(new KeyboardEvent('keydown', { key: 'Enter' }));

    await expect(resultado).resolves.toBe(true);
    expect(confirmacion.estado()).toBeNull();
  });
});
