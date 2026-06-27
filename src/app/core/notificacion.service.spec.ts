import { describe, expect, it, vi } from 'vitest';
import { NotificacionService } from './notificacion.service';

describe('NotificacionService', () => {
  it('muestra una notificacion de exito y la cierra automaticamente', () => {
    vi.useFakeTimers();
    const service = new NotificacionService();

    service.success('Producto actualizado correctamente.');

    expect(service.estado()?.tipo).toBe('success');
    expect(service.estado()?.mensaje).toBe('Producto actualizado correctamente.');

    vi.advanceTimersByTime(3500);

    expect(service.estado()).toBeNull();
    vi.useRealTimers();
  });

  it('reemplaza la notificacion activa y reinicia el temporizador', () => {
    vi.useFakeTimers();
    const service = new NotificacionService();

    service.error('Primer error.');
    vi.advanceTimersByTime(2000);
    service.success('Operacion completada.');
    vi.advanceTimersByTime(2000);

    expect(service.estado()?.mensaje).toBe('Operacion completada.');

    vi.advanceTimersByTime(1500);

    expect(service.estado()).toBeNull();
    vi.useRealTimers();
  });
});
