import { Routes } from '@angular/router';
import { AppShell } from './features/layout/app-shell/app-shell';
import { Login } from './features/login/login';
import { Dashboard } from './features/dashboard/dashboard';
import { Products } from './features/products/products';
import { Providers } from './features/providers/providers';
import { Inventory } from './features/inventory/inventory';
import { Movements } from './features/movements/movements';
import { Reports } from './features/reports/reports';
import { Users } from './features/users/users';

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    component: AppShell,
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'productos', component: Products },
      { path: 'proveedores', component: Providers },
      { path: 'inventario', component: Inventory },
      { path: 'movimientos', component: Movements },
      { path: 'reportes', component: Reports },
      { path: 'usuarios', component: Users },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
