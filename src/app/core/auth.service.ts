import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Role, SessionUser } from './models';

const SESSION_KEY = 'titishop_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly session = signal<SessionUser | null>(this.readSession());

  constructor(private router: Router) {}

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
}
