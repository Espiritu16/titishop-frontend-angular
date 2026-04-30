import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  feedback = '';

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  clearLocalData(): void {
    const keys = Object.keys(localStorage).filter((key) => key.startsWith('titishop_'));
    keys.forEach((key) => localStorage.removeItem(key));
    this.seedInitialData();
    this.auth.session.set(null);
    void this.router.navigate(['/login']);
  }

  private seedInitialData(): void {
    localStorage.setItem(
      'titishop_usuarios',
      JSON.stringify([
        {
          id: crypto.randomUUID(),
          fullName: 'Admin TitiShop',
          email: 'admin@titishop.pe',
          password: '123456',
          role: 'ADMINISTRADOR',
          active: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: crypto.randomUUID(),
          fullName: 'Almacén Principal',
          email: 'almacen@titishop.pe',
          password: '123456',
          role: 'ALMACENERO',
          active: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: crypto.randomUUID(),
          fullName: 'Sonia Supervisora',
          email: 'supervisor@titishop.pe',
          password: '123456',
          role: 'SUPERVISOR',
          active: true,
          createdAt: new Date().toISOString(),
        },
      ])
    );
  }
}
