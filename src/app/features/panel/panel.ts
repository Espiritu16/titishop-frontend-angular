import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { getApiErrorMessage } from '../../core/api-error';
import { EstadoCarga } from '../../core/estado-carga';
import { PanelResumenResponse, TipoMovimiento } from '../../core/models';
import { PanelService } from './panel.service';

interface KpiItem {
  label: string;
  value: number | string;
  meta: string;
}

@Component({
  host: { class: 'flex-1 flex flex-col overflow-hidden min-h-0' },
  selector: 'app-panel',
  imports: [DatePipe],
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
      },
      {
        label: 'Stock crítico',
        value: resumen?.productosStockCritico ?? 0,
        meta: 'Requiere reposición',
      },
      {
        label: 'Movimientos hoy',
        value: resumen?.movimientosDelDia ?? 0,
        meta: 'Actividad diaria',
      },
      {
        label: 'Valor inventario',
        value: `S/ ${resumen?.valorEstimadoInventario ?? 0}`,
        meta: 'Costo estimado',
      },
    ];
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
