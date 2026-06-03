import { Component } from '@angular/core';
import { AuthService } from '../../core/auth.service';

@Component({
  host: { class: 'flex-1 flex flex-col overflow-hidden min-h-0' },
  selector: 'app-configuracion',
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.scss',
})
export class Configuracion {
  feedback = '';

  constructor(private auth: AuthService) {}

  clearLocalData(): void {
    this.auth.clearSession();
    this.feedback = 'Sesión temporal limpiada. Los datos ya no se guardan en el navegador.';
  }
}
