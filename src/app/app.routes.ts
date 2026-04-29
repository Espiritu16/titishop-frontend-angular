import { Routes } from '@angular/router';
import { Settings } from './features/settings/settings';

export const routes: Routes = [
  { path: 'configuracion', component: Settings },
  { path: '', redirectTo: 'configuracion', pathMatch: 'full' },
  { path: '**', redirectTo: 'configuracion' },
];
