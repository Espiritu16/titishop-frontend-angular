import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { routes } from './app.routes';

describe('routes', () => {
  it('protects authenticated application routes before backend data loads', () => {
    const loginRoute = routes.find((route) => route.path === 'login');
    const shellRoute = routes.find((route) => route.path === '');

    expect(loginRoute?.canMatch?.length).toBeGreaterThan(0);
    expect(shellRoute?.canMatch?.length).toBeGreaterThan(0);
  });

  it('protects role-limited routes in the application shell', () => {
    const shellRoute = routes.find((route) => route.path === '');
    const children = shellRoute?.children ?? [];

    const protectedPaths = [
      'inicio',
      'dashboard',
      'productos',
      'proveedores',
      'inventario',
      'movimientos',
      'reportes',
      'usuarios',
      'configuracion',
    ];

    for (const path of protectedPaths) {
      const route = children.find((child) => child.path === path);
      expect(route?.canActivate?.length).toBeGreaterThan(0);
    }
  });
});
