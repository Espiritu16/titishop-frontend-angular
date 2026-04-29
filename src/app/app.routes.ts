import { Routes } from '@angular/router';
import { Users } from './features/users/users';

export const routes: Routes = [
  { path: 'usuarios', component: Users },
  { path: '', redirectTo: 'usuarios', pathMatch: 'full' },
  { path: '**', redirectTo: 'usuarios' },
];
