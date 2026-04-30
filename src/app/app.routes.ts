import { Routes } from '@angular/router';
import { AppShell } from './features/layout/app-shell/app-shell';
import { Login } from './features/login/login';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: '', component: AppShell },
  { path: '**', redirectTo: '' },
];
