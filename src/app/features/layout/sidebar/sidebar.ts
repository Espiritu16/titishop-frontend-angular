import { Component } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { Role } from '../../../core/models';

type SidebarItem = {
  label: string;
  path: string;
  icon: string;
  roles?: Role[];
};

@Component({
  selector: 'app-sidebar',
  imports: [NgClass, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  readonly items: SidebarItem[] = [
    { label: 'Panel', path: '/dashboard', icon: 'bi-speedometer2' },
    { label: 'Productos', path: '/productos', icon: 'bi-box-seam' },
    { label: 'Proveedores', path: '/proveedores', icon: 'bi-truck' },
    { label: 'Inventario', path: '/inventario', icon: 'bi-stack' },
    { label: 'Movimientos', path: '/movimientos', icon: 'bi-arrow-left-right' },
    { label: 'Reportes', path: '/reportes', icon: 'bi-bar-chart', roles: ['ADMINISTRADOR', 'SUPERVISOR'] },
    { label: 'Usuarios', path: '/usuarios', icon: 'bi-people', roles: ['ADMINISTRADOR'] },
    { label: 'Configuración', path: '/configuracion', icon: 'bi-gear', roles: ['ADMINISTRADOR'] },
  ];

  constructor(public auth: AuthService) {}

  canShow(item: SidebarItem): boolean {
    if (!item.roles) return true;
    return this.auth.hasAnyRole(item.roles);
  }

  logout(): void {
    this.auth.logout();
  }
}
