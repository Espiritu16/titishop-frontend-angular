import { Routes } from '@angular/router';
import { Providers } from './features/providers/providers';

export const routes: Routes = [
  { path: 'proveedores', component: Providers },
  { path: '', redirectTo: 'proveedores', pathMatch: 'full' },
  { path: '**', redirectTo: 'proveedores' },
];
