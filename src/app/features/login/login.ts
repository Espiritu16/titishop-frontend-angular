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
  recuperacionEmail = '';
  recuperacionCodigo = '';
  recuperacionNuevaPassword = '';
  recuperacionResetToken = '';
  recuperacionActiva = false;
  recuperacionPaso: 'email' | 'codigo' | 'password' = 'email';
  error = '';
  message = '';
  loading = false;
  mostrarPassword = false;
  mostrarRecuperacionPassword = false;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  get canSubmit(): boolean {
    return !!this.email.trim() && !!this.password.trim() && !this.loading;
  }

  togglePasswordVisibility(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  toggleRecuperacionPasswordVisibility(): void {
    this.mostrarRecuperacionPassword = !this.mostrarRecuperacionPassword;
  }

  iniciarRecuperacion(): void {
    this.error = '';
    this.message = '';
    this.recuperacionActiva = true;
    this.recuperacionPaso = 'email';
    this.recuperacionEmail = this.email.trim();
    this.recuperacionCodigo = '';
    this.recuperacionNuevaPassword = '';
    this.recuperacionResetToken = '';
    this.mostrarRecuperacionPassword = false;
  }

  volverLogin(): void {
    this.error = '';
    this.message = '';
    this.recuperacionActiva = false;
    this.recuperacionPaso = 'email';
    this.recuperacionCodigo = '';
    this.recuperacionNuevaPassword = '';
    this.recuperacionResetToken = '';
    this.loading = false;
  }

  submitRecuperacion(): void {
    this.error = '';
    this.message = '';
    if (this.recuperacionPaso === 'email') {
      this.solicitarCodigo();
      return;
    }
    if (this.recuperacionPaso === 'codigo') {
      this.validarCodigo();
      return;
    }
    this.restablecerPassword();
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

  private solicitarCodigo(): void {
    if (!this.recuperacionEmail.trim()) {
      this.error = 'Ingrese su correo.';
      return;
    }
    this.loading = true;
    this.auth.solicitarRecuperacionPassword(this.recuperacionEmail).subscribe({
      next: (response) => {
        this.loading = false;
        this.message = response.mensaje;
        this.recuperacionPaso = 'codigo';
      },
      error: (error: unknown) => {
        this.loading = false;
        this.error = getApiErrorMessage(error);
      },
    });
  }

  private validarCodigo(): void {
    if (!/^\d{6}$/.test(this.recuperacionCodigo.trim())) {
      this.error = 'Ingrese el codigo de 6 digitos.';
      return;
    }
    this.loading = true;
    this.auth.validarCodigoRecuperacion(this.recuperacionEmail, this.recuperacionCodigo).subscribe({
      next: (response) => {
        this.loading = false;
        this.recuperacionResetToken = response.resetToken;
        this.recuperacionPaso = 'password';
        this.message = 'Codigo validado. Ingresa tu nueva contrasena.';
      },
      error: (error: unknown) => {
        this.loading = false;
        this.error = getApiErrorMessage(error);
      },
    });
  }

  private restablecerPassword(): void {
    if (this.recuperacionNuevaPassword.trim().length < 8) {
      this.error = 'La nueva contrasena debe tener al menos 8 caracteres.';
      return;
    }
    this.loading = true;
    this.auth.restablecerPassword(
      this.recuperacionEmail,
      this.recuperacionResetToken,
      this.recuperacionNuevaPassword.trim()
    ).subscribe({
      next: (response) => {
        this.loading = false;
        this.message = response.mensaje;
        this.password = '';
        this.volverLogin();
        this.message = 'Contrasena actualizada. Inicia sesion con tu nueva clave.';
      },
      error: (error: unknown) => {
        this.loading = false;
        this.error = getApiErrorMessage(error);
      },
    });
  }
}
