import { Routes } from '@angular/router';
import { Products } from './features/products/products';

export const routes: Routes = [
  { path: 'productos', component: Products },
  { path: '', redirectTo: 'productos', pathMatch: 'full' },
  { path: '**', redirectTo: 'productos' },
];
