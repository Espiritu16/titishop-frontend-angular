import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  email = 'admin@titishop.pe';
  password = '123456';
  error = '';
  message = '';

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  get canSubmit(): boolean {
    return !!this.email.trim() && !!this.password.trim();
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

    const result = this.auth.login(this.email, this.password);
    if (!result.ok) {
      this.error = result.message;
      return;
    }

    this.message = result.message;
    // Keep flow simple for this branch: login route remains the main screen for now.
    void this.router.navigate(['/login']);
  }
}
