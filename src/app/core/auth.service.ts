import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Role, SessionUser } from './models';

interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  password: string;
  role: Role;
  active: boolean;
}

const USERS_KEY = 'titishop_users';
const SESSION_KEY = 'titishop_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly session = signal<SessionUser | null>(this.readSession());

  constructor(private router: Router) {
    this.ensureUsersSeed();
  }

  login(email: string, password: string): { ok: boolean; message: string } {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]') as UserRecord[];
    const user = users.find(
      (item) =>
        item.active &&
        item.email.trim().toLowerCase() === email.trim().toLowerCase() &&
        item.password === password
    );
    if (!user) return { ok: false, message: 'Credenciales inválidas.' };

    const session: SessionUser = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      loginAt: new Date().toISOString(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    this.session.set(session);
    return { ok: true, message: 'Inicio de sesión correcto.' };
  }

  hasAnyRole(roles: Role[]): boolean {
    const currentRole = this.session()?.role;
    return !!currentRole && roles.includes(currentRole);
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    this.session.set(null);
    this.router.navigateByUrl('/');
  }

  private readSession(): SessionUser | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as SessionUser;
    } catch {
      return null;
    }
  }

  private ensureUsersSeed(): void {
    if (localStorage.getItem(USERS_KEY)) return;
    const users: UserRecord[] = [
      {
        id: crypto.randomUUID(),
        fullName: 'Ana Administradora',
        email: 'admin@titishop.pe',
        password: '123456',
        role: 'ADMINISTRADOR',
        active: true,
      },
      {
        id: crypto.randomUUID(),
        fullName: 'Walter Almacenero',
        email: 'almacen@titishop.pe',
        password: '123456',
        role: 'ALMACENERO',
        active: true,
      },
      {
        id: crypto.randomUUID(),
        fullName: 'Sonia Supervisora',
        email: 'supervisor@titishop.pe',
        password: '123456',
        role: 'SUPERVISOR',
        active: true,
      },
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
}
