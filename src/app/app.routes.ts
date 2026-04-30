import { Routes } from '@angular/router';
import { AppShell } from './features/layout/app-shell/app-shell';

export const routes: Routes = [
  { path: '', component: AppShell },
  { path: '**', redirectTo: '' },
];
