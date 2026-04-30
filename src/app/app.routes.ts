import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router, Routes } from '@angular/router';
import { AppShell } from './features/layout/app-shell/app-shell';
import { Login } from './features/login/login';
import { Dashboard } from './features/dashboard/dashboard';
import { Products } from './features/products/products';
import { Providers } from './features/providers/providers';
import { Inventory } from './features/inventory/inventory';
import { Movements } from './features/movements/movements';
import { Reports } from './features/reports/reports';
import { Users } from './features/users/users';
import { Settings } from './features/settings/settings';
import { AuthService } from './core/auth.service';
import { Role } from './core/models';

const requireAuth: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.session() ? true : router.createUrlTree(['/login']);
};

const onlyGuest: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.session() ? router.createUrlTree(['/dashboard']) : true;
};

const requireRoles = (roles: Role[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    return auth.hasAnyRole(roles) ? true : router.createUrlTree(['/dashboard']);
  };
};

export const routes: Routes = [
  { path: 'login', component: Login, canMatch: [onlyGuest] },
  {
    path: '',
    component: AppShell,
    canMatch: [requireAuth],
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'productos', component: Products },
      { path: 'proveedores', component: Providers },
      { path: 'inventario', component: Inventory },
      { path: 'movimientos', component: Movements },
      { path: 'reportes', component: Reports, canActivate: [requireRoles(['ADMINISTRADOR', 'SUPERVISOR'])] },
      { path: 'usuarios', component: Users, canActivate: [requireRoles(['ADMINISTRADOR'])] },
      { path: 'configuracion', component: Settings, canActivate: [requireRoles(['ADMINISTRADOR'])] },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '/dashboard' },
];
