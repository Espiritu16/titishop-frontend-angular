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

    const reportesRoute = children.find((route) => route.path === 'reportes');
    const usuariosRoute = children.find((route) => route.path === 'usuarios');
    const configuracionRoute = children.find((route) => route.path === 'configuracion');

    expect(reportesRoute?.canActivate?.length).toBeGreaterThan(0);
    expect(usuariosRoute?.canActivate?.length).toBeGreaterThan(0);
    expect(configuracionRoute?.canActivate?.length).toBeGreaterThan(0);
  });
});
