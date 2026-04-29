import { Routes } from '@angular/router';
import { Login } from './features/login/login';
import { AppShell } from './features/layout/app-shell/app-shell';

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: 'app',
    component: AppShell,
    children: [{ path: '', component: Login }],
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
