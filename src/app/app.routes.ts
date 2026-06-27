import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router, Routes } from '@angular/router';
import { AuthService } from './core/auth.service';
import { Role } from './core/models';
import { AppShell } from './features/layout/app-shell/app-shell';
import { Login } from './features/login/login';
import { Panel } from './features/panel/panel';
import { Productos } from './features/productos/productos';
import { Proveedores } from './features/proveedores/proveedores';
import { Inventario } from './features/inventario/inventario';
import { Movimientos } from './features/movimientos/movimientos';
import { Reportes } from './features/reportes/reportes';
import { Usuarios } from './features/usuarios/usuarios';
import { Configuracion } from './features/configuracion/configuracion';

const requireAuth: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.session() && auth.token() ? true : router.createUrlTree(['/login']);
};

const onlyGuest: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.session() && auth.token() ? router.createUrlTree(['/dashboard']) : true;
};

const requireRoles = (roles: Role[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.session() || !auth.token()) return router.createUrlTree(['/login']);
    return auth.hasAnyRole(roles) ? true : router.createUrlTree([rutaInicialPorRol(auth.session()?.role)]);
  };
};

const rutaInicialPorRol = (role?: Role): string => {
  if (role === 'ALMACENERO') return '/productos';
  return '/dashboard';
};

export const routes: Routes = [
  { path: 'login', component: Login, canMatch: [onlyGuest] },
  {
    path: '',
    component: AppShell,
    canMatch: [requireAuth],
    children: [
      { path: 'inicio', component: Panel, canActivate: [requireRoles(['ADMINISTRADOR', 'SUPERVISOR'])] },
      { path: 'dashboard', component: Panel, canActivate: [requireRoles(['ADMINISTRADOR', 'SUPERVISOR'])] },
      { path: 'productos', component: Productos, canActivate: [requireRoles(['ADMINISTRADOR', 'ALMACENERO'])] },
      { path: 'proveedores', component: Proveedores, canActivate: [requireRoles(['ADMINISTRADOR', 'ALMACENERO'])] },
      { path: 'inventario', component: Inventario, canActivate: [requireRoles(['ADMINISTRADOR', 'ALMACENERO'])] },
      { path: 'movimientos', component: Movimientos, canActivate: [requireRoles(['ADMINISTRADOR', 'ALMACENERO'])] },
      { path: 'reportes', component: Reportes, canActivate: [requireRoles(['ADMINISTRADOR', 'SUPERVISOR'])] },
      { path: 'usuarios', component: Usuarios, canActivate: [requireRoles(['ADMINISTRADOR'])] },
      { path: 'configuracion', component: Configuracion, canActivate: [requireRoles(['ADMINISTRADOR'])] },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '/dashboard' },
];
