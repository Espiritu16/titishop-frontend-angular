import { Routes } from '@angular/router';
import { Inventory } from './features/inventory/inventory';

export const routes: Routes = [
  { path: 'inventario', component: Inventory },
  { path: '', redirectTo: 'inventario', pathMatch: 'full' },
  { path: '**', redirectTo: 'inventario' },
];
