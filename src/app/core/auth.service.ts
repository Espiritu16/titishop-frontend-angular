import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { apiUrl } from './api.config';
import { LoginResponse, MensajeResponse, Role, SessionUser, ValidarCodigoRecuperacionResponse } from './models';

const TOKEN_SESION_KEY = 'token_sesion';
const USUARIO_SESION_KEY = 'usuario_sesion';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly session = signal<SessionUser | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.restaurarSesion();
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(apiUrl('/autenticacion/login'), {
        email: email.trim().toLowerCase(),
        password,
      })
      .pipe(
        tap((response) => {
          const session: SessionUser = {
            id: response.usuarioId,
            fullName: response.nombreCompleto,
            email: response.email,
            role: response.rol,
            loginAt: new Date().toISOString(),
            expiresAt: response.expiraEn,
          };
          this.session.set(session);
          sessionStorage.setItem(TOKEN_SESION_KEY, response.token);
          sessionStorage.setItem(USUARIO_SESION_KEY, JSON.stringify(session));
        })
      );
  }

  solicitarRecuperacionPassword(email: string): Observable<MensajeResponse> {
    return this.http.post<MensajeResponse>(apiUrl('/autenticacion/recuperacion/solicitar'), {
      email: email.trim().toLowerCase(),
    });
  }

  validarCodigoRecuperacion(email: string, codigo: string): Observable<ValidarCodigoRecuperacionResponse> {
    return this.http.post<ValidarCodigoRecuperacionResponse>(apiUrl('/autenticacion/recuperacion/validar'), {
      email: email.trim().toLowerCase(),
      codigo: codigo.trim(),
    });
  }

  restablecerPassword(email: string, resetToken: string, nuevaPassword: string): Observable<MensajeResponse> {
    return this.http.post<MensajeResponse>(apiUrl('/autenticacion/recuperacion/restablecer'), {
      email: email.trim().toLowerCase(),
      resetToken,
      nuevaPassword,
    });
  }

  token(): string | null {
    return sessionStorage.getItem(TOKEN_SESION_KEY);
  }

  hasAnyRole(roles: Role[]): boolean {
    const currentRole = this.session()?.role;
    return !!currentRole && roles.includes(currentRole);
  }

  clearSession(): void {
    this.session.set(null);
    sessionStorage.removeItem(TOKEN_SESION_KEY);
    sessionStorage.removeItem(USUARIO_SESION_KEY);
  }

  logout(): void {
    this.clearSession();
    this.router.navigateByUrl('/');
  }

  private restaurarSesion(): void {
    const storedSession = sessionStorage.getItem(USUARIO_SESION_KEY);
    if (!storedSession) return;

    try {
      this.session.set(JSON.parse(storedSession) as SessionUser);
    } catch {
      this.clearSession();
    }
  }
}
