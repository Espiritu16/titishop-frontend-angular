import { Component, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { ConfirmacionService } from '../../../core/confirmacion.service';
import { Role } from '../../../core/models';
import { NotificacionService } from '../../../core/notificacion.service';
import { ThemeService } from '../../../core/theme.service';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles?: Role[];
  hasArrow?: boolean;
}

@Component({
  selector: 'app-app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app-shell.html',
})
export class AppShell {
  sidebarOpen = false;

  constructor(
    public auth: AuthService,
    public theme: ThemeService,
    public confirmacion: ConfirmacionService,
    public notificacion: NotificacionService
  ) {}

  navItems: NavItem[] = [
    { label: 'Panel', path: '/dashboard', icon: 'bi-grid-1x2-fill' },
    { label: 'Productos', path: '/productos', icon: 'bi-box-seam', hasArrow: true },
    { label: 'Proveedores', path: '/proveedores', icon: 'bi-truck', hasArrow: true },
    { label: 'Inventario', path: '/inventario', icon: 'bi-archive', hasArrow: true },
    { label: 'Movimientos', path: '/movimientos', icon: 'bi-arrow-left-right', hasArrow: true },
    { label: 'Reportes', path: '/reportes', icon: 'bi-bar-chart-line', hasArrow: true, roles: ['ADMINISTRADOR', 'SUPERVISOR'] },
  ];

  configItems: NavItem[] = [
    { label: 'Usuarios', path: '/usuarios', icon: 'bi-people', hasArrow: true, roles: ['ADMINISTRADOR'] },
    { label: 'Configuración', path: '/configuracion', icon: 'bi-gear', roles: ['ADMINISTRADOR'] },
  ];

  get userName(): string { return this.auth.session()?.fullName ?? 'Usuario'; }
  get userRole(): string { return this.auth.session()?.role ?? ''; }
  async logout(): Promise<void> {
    const confirmado = await this.confirmacion.confirmar({
      titulo: 'Cerrar sesión',
      mensaje: 'Se cerrará tu sesión actual y volverás a la pantalla de acceso.',
      textoConfirmar: 'Cerrar sesión',
      tono: 'danger',
    });
    if (confirmado) this.auth.logout();
  }
  closeSidebar(): void { this.sidebarOpen = false; }
  toggleTheme(): void { this.theme.toggle(); }

  @HostListener('document:keydown.enter', ['$event'])
  confirmarConEnter(event: Event): void {
    if (!this.confirmacion.estado()) return;
    event.preventDefault();
    this.confirmacion.aceptar();
  }
}
