import { Component } from '@angular/core';

type KpiTone = 'success' | 'warning' | 'neutral';
type AlertState = 'AGOTADO' | 'STOCK_BAJO';
type MovementType = 'ENTRADA' | 'SALIDA' | 'AJUSTE';

interface KpiItem {
  label: string;
  value: number;
  meta: string;
  tone: KpiTone;
}

interface InventoryAlert {
  productName: string;
  sku: string;
  state: AlertState;
}

interface RecentMovement {
  type: MovementType;
  productName: string;
  quantity: number;
  userName: string;
  time: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  readonly kpis: KpiItem[] = [
    { label: 'Productos activos', value: 248, meta: '+12 este mes', tone: 'success' },
    { label: 'Stock bajo', value: 18, meta: 'Requiere reposición', tone: 'warning' },
    { label: 'Entradas hoy', value: 34, meta: '6 proveedores', tone: 'success' },
    { label: 'Salidas hoy', value: 21, meta: 'Sin incidencias', tone: 'neutral' },
  ];

  readonly alerts: InventoryAlert[] = [
    { productName: 'Cable USB-C 2m', sku: 'TITI-USB-02', state: 'AGOTADO' },
    { productName: 'Lámpara LED escritorio', sku: 'TITI-HOG-15', state: 'STOCK_BAJO' },
    { productName: 'Audífonos Bluetooth', sku: 'TITI-AUD-09', state: 'STOCK_BAJO' },
  ];

  readonly recentMovements: RecentMovement[] = [
    { type: 'ENTRADA', productName: 'Mouse inalámbrico', quantity: 20, userName: 'María Soto', time: '09:42' },
    { type: 'SALIDA', productName: 'Memoria USB 64GB', quantity: 8, userName: 'Luis Peña', time: '10:05' },
    { type: 'AJUSTE', productName: 'Parlante portátil', quantity: 3, userName: 'Ana Ruiz', time: '10:18' },
  ];

  get criticalAlertsCount(): number {
    return this.alerts.filter((alert) => alert.state === 'AGOTADO').length;
  }

  toneClass(tone: KpiTone): string {
    return `kpi-meta ${tone}`;
  }

  alertBadgeClass(state: AlertState): string {
    return state === 'AGOTADO' ? 'badge text-bg-danger' : 'badge text-bg-warning';
  }

  alertLabel(state: AlertState): string {
    return state === 'AGOTADO' ? 'Agotado' : 'Stock bajo';
  }

  movementBadgeClass(type: MovementType): string {
    if (type === 'ENTRADA') return 'badge text-bg-success';
    if (type === 'SALIDA') return 'badge text-bg-primary';
    return 'badge text-bg-secondary';
  }

  movementLabel(type: MovementType): string {
    if (type === 'ENTRADA') return 'Entrada';
    if (type === 'SALIDA') return 'Salida';
    return 'Ajuste';
  }

  movementQuantity(type: MovementType, quantity: number): string {
    return type === 'SALIDA' ? `-${quantity}` : `+${quantity}`;
  }
}
