import { Routes } from '@angular/router';
import { Movements } from './features/movements/movements';

export const routes: Routes = [
  { path: 'movimientos', component: Movements },
  { path: '', redirectTo: 'movimientos', pathMatch: 'full' },
  { path: '**', redirectTo: 'movimientos' },
];
