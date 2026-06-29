import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { getApiErrorMessage } from '../../core/api-error';
import { EstadoCarga } from '../../core/estado-carga';
import { PanelResumenResponse, TipoMovimiento } from '../../core/models';
import { PanelService } from './panel.service';

interface KpiItem {
  label: string;
  value: number | string;
  meta: string;
  icon: string;
  tone: 'indigo' | 'emerald' | 'amber' | 'rose';
}

interface QuickAction {
  label: string;
  description: string;
  path: string;
  icon: string;
}

@Component({
  host: { class: 'flex-1 flex flex-col overflow-hidden min-h-0' },
  selector: 'app-panel',
  imports: [DatePipe, CurrencyPipe, RouterLink],
  templateUrl: './panel.html',
  styleUrl: './panel.scss',
})
export class Panel {
  estado: EstadoCarga = 'inicial';
  error = '';
  resumen: PanelResumenResponse | null = null;

  constructor(private panelService: PanelService) {
    this.cargarPanel();
  }

  get kpis(): KpiItem[] {
    const resumen = this.resumen;
    return [
      {
        label: 'Productos activos',
        value: resumen?.totalProductosActivos ?? 0,
        meta: 'Catálogo vigente',
        icon: 'bi-box-seam',
        tone: 'indigo',
      },
      {
        label: 'Proveedores activos',
        value: resumen?.totalProveedoresActivos ?? 0,
        meta: 'Abastecimiento habilitado',
        icon: 'bi-truck',
        tone: 'emerald',
      },
      {
        label: 'Stock crítico',
        value: resumen?.productosStockCritico ?? 0,
        meta: 'Requiere reposición',
        icon: 'bi-exclamation-triangle',
        tone: 'amber',
      },
      {
        label: 'Movimientos hoy',
        value: resumen?.movimientosDelDia ?? 0,
        meta: 'Actividad diaria',
        icon: 'bi-arrow-left-right',
        tone: 'rose',
      },
    ];
  }

  get quickActions(): QuickAction[] {
    return [
      {
        label: 'Registrar movimiento',
        description: 'Entradas, salidas o ajustes',
        path: '/movimientos',
        icon: 'bi-plus-circle',
      },
      {
        label: 'Revisar inventario',
        description: 'Stock actual y mínimo',
        path: '/inventario',
        icon: 'bi-archive',
      },
      {
        label: 'Gestionar productos',
        description: 'Catálogo y precios',
        path: '/productos',
        icon: 'bi-box',
      },
      {
        label: 'Ver reportes',
        description: 'Movimientos y valorización',
        path: '/reportes',
        icon: 'bi-bar-chart-line',
      },
    ];
  }

  get balanceMensual(): number {
    return (this.resumen?.entradasDelMes ?? 0) - (this.resumen?.salidasDelMes ?? 0);
  }

  get porcentajeSalidaMensual(): number {
    const entradas = this.resumen?.entradasDelMes ?? 0;
    const salidas = this.resumen?.salidasDelMes ?? 0;
    if (entradas <= 0) return salidas > 0 ? 100 : 0;
    return Math.min(100, Math.round((salidas / entradas) * 100));
  }

  get estadoOperativo(): string {
    if ((this.resumen?.productosStockCritico ?? 0) > 0) return 'Atención requerida';
    if ((this.resumen?.movimientosDelDia ?? 0) > 0) return 'Operación activa';
    return 'Sin incidencias';
  }

  kpiToneClasses(tone: KpiItem['tone']): string {
    if (tone === 'emerald') return 'bg-emerald-50 text-emerald-600';
    if (tone === 'amber') return 'bg-amber-50 text-amber-600';
    if (tone === 'rose') return 'bg-rose-50 text-rose-600';
    return 'bg-indigo-50 text-indigo-600';
  }

  cargarPanel(): void {
    this.estado = 'cargando';
    this.error = '';
    this.panelService.resumen().subscribe({
      next: (resumen) => {
        this.resumen = resumen;
        this.estado = 'exito';
      },
      error: (error: unknown) => {
        this.estado = 'error';
        this.error = getApiErrorMessage(error);
      },
    });
  }

  movimientoClase(type: TipoMovimiento): string {
    if (type === 'ENTRADA') return 'bg-green-100 text-green-700';
    if (type === 'SALIDA') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-600';
  }

  movimientoCantidad(type: TipoMovimiento, quantity: number): string {
    return type === 'SALIDA' ? `-${quantity}` : `+${quantity}`;
  }

}
