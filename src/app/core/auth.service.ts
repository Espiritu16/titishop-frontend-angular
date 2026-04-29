import { Injectable } from '@angular/core';

type Role = 'ADMINISTRADOR' | 'ALMACENERO' | 'SUPERVISOR';

interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  password: string;
  role: Role;
  active: boolean;
}

interface SessionData {
  userId: string;
  fullName: string;
  role: Role;
  loginAt: string;
}

const USERS_KEY = 'titishop_users';
const SESSION_KEY = 'titishop_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor() {
    this.ensureUsersSeed();
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

  login(email: string, password: string): { ok: boolean; message: string } {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]') as UserRecord[];
    const user = users.find(
      (item) =>
        item.active &&
        item.email.trim().toLowerCase() === email.trim().toLowerCase() &&
        item.password === password,
    );
    if (!user) return { ok: false, message: 'Credenciales inválidas.' };

    const session: SessionData = {
      userId: user.id,
      fullName: user.fullName,
      role: user.role,
      loginAt: new Date().toISOString(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { ok: true, message: 'Inicio de sesión correcto.' };
  }
}
