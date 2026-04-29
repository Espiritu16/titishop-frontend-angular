import { Routes } from '@angular/router';
import { Reports } from './features/reports/reports';

export const routes: Routes = [
  { path: 'reportes', component: Reports },
  { path: '', redirectTo: 'reportes', pathMatch: 'full' },
  { path: '**', redirectTo: 'reportes' },
];
