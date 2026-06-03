import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { getApiErrorMessage } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  email = 'kevin@gmail.com';
  password = 'kevin123';
  error = '';
  message = '';
  loading = false;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  get canSubmit(): boolean {
    return !!this.email.trim() && !!this.password.trim() && !this.loading;
  }

  submit(): void {
    this.message = '';
    this.error = '';

    if (!this.email.trim()) {
      this.error = 'Ingrese su correo.';
      return;
    }
    if (!this.password.trim()) {
      this.error = 'Ingrese su contraseña.';
      return;
    }

    this.loading = true;
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.message = 'Inicio de sesión correcto.';
        void this.router.navigate(['/']);
      },
      error: (error: unknown) => {
        this.loading = false;
        this.error = getApiErrorMessage(error);
      },
    });
  }
}
