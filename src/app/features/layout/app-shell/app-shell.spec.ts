import { describe, expect, it, vi } from 'vitest';
import { ConfirmacionService } from '../../../core/confirmacion.service';
import { NotificacionService } from '../../../core/notificacion.service';
import { AppShell } from './app-shell';

describe('AppShell', () => {
  const crearShell = (role: 'ADMINISTRADOR' | 'ALMACENERO' | 'SUPERVISOR') => new AppShell(
    {
      session: () => ({ fullName: 'Kevin', role }),
      hasAnyRole: (roles: string[]) => roles.includes(role),
      logout: vi.fn(),
    } as never,
    { isDark: false, toggle: vi.fn() } as never,
    new ConfirmacionService(),
    new NotificacionService()
  );

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

  it('oculta opciones no permitidas para almacenero', () => {
    const shell = crearShell('ALMACENERO');

    expect(shell.visibleNavItems.map((item) => item.label)).toEqual([
      'Productos',
      'Proveedores',
      'Inventario',
      'Movimientos',
    ]);
    expect(shell.visibleConfigItems).toEqual([]);
  });

  it('muestra solo panel y reportes para supervisor', () => {
    const shell = crearShell('SUPERVISOR');

    expect(shell.visibleNavItems.map((item) => item.label)).toEqual(['Panel', 'Reportes']);
    expect(shell.visibleConfigItems).toEqual([]);
  });
});
