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

interface ProductRecord {
  status?: 'ACTIVO' | 'INACTIVO';
}

interface StockRecord {
  sku: string;
  product: string;
  stock: number;
}

interface MovementRecord {
  createdAt: string;
  type: MovementType;
  product: string;
  quantity: number;
  user: string;
}

const PRODUCTS_KEY = 'titishop_productos';
const STOCK_KEY = 'titishop_stock';
const MOVEMENTS_KEY = 'titishop_movimientos';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  kpis: KpiItem[] = [];
  alerts: InventoryAlert[] = [];
  recentMovements: RecentMovement[] = [];

  constructor() {
    this.loadDashboardData();
  }

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

  private loadDashboardData(): void {
    const products = this.readArray<ProductRecord>(PRODUCTS_KEY);
    const stock = this.readArray<StockRecord>(STOCK_KEY);
    const movements = this.readArray<MovementRecord>(MOVEMENTS_KEY);
    const now = new Date();
    const sameDay = (iso: string) => {
      const d = new Date(iso);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    };

    const activeProducts = products.filter((p) => (p.status ?? 'ACTIVO') === 'ACTIVO').length;
    const lowStock = stock.filter((s) => s.stock > 0 && s.stock <= 10).length;
    const entradasHoy = movements.filter((m) => m.type === 'ENTRADA' && sameDay(m.createdAt)).length;
    const salidasHoy = movements.filter((m) => m.type === 'SALIDA' && sameDay(m.createdAt)).length;

    this.kpis = [
      { label: 'Productos activos', value: activeProducts, meta: 'Catálogo vigente', tone: 'success' },
      { label: 'Stock bajo', value: lowStock, meta: 'Requiere reposición', tone: 'warning' },
      { label: 'Entradas hoy', value: entradasHoy, meta: 'Movimientos del día', tone: 'success' },
      { label: 'Salidas hoy', value: salidasHoy, meta: 'Movimientos del día', tone: 'neutral' },
    ];

    this.alerts = stock
      .filter((s) => s.stock <= 10)
      .slice(0, 6)
      .map((s) => ({
        productName: s.product,
        sku: s.sku,
        state: s.stock <= 0 ? 'AGOTADO' : 'STOCK_BAJO',
      }));

    this.recentMovements = movements
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8)
      .map((m) => ({
        type: m.type,
        productName: m.product,
        quantity: m.quantity,
        userName: m.user,
        time: new Date(m.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false }),
      }));
  }

  private readArray<T>(key: string): T[] {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? (JSON.parse(raw) as T[]) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
