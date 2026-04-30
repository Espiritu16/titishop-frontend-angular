import { Routes } from '@angular/router';
import { AppShell } from './features/layout/app-shell/app-shell';
import { Login } from './features/login/login';
import { Dashboard } from './features/dashboard/dashboard';
import { Products } from './features/products/products';

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    component: AppShell,
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'productos', component: Products },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
