import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { getApiErrorMessage } from '../../core/api-error';
import { EstadoCarga } from '../../core/estado-carga';
import {
  EstadoInventario,
  ReporteMovimientosResponse,
  ReporteStockCriticoResponse,
  ReporteStockResponse,
  ReporteValorizacionResponse,
  TipoMovimiento,
} from '../../core/models';
import { ReportesService } from './reportes.service';

type PestanaReporte = 'movimientos' | 'stock' | 'critico' | 'valorizacion';

@Component({
  host: { class: 'flex-1 flex flex-col overflow-hidden min-h-0' },
  selector: 'app-reportes',
  imports: [ReactiveFormsModule, DatePipe, DecimalPipe, CurrencyPipe],
  templateUrl: './reportes.html',
  styleUrl: './reportes.scss',
})
export class Reportes {
  pestanaActiva: PestanaReporte = 'movimientos';
  estado: EstadoCarga = 'inicial';
  error = '';

  readonly tiposMovimiento: Array<TipoMovimiento | 'TODOS'> = ['TODOS', 'ENTRADA', 'SALIDA', 'AJUSTE'];
  readonly estadosInventario: Array<EstadoInventario | 'TODOS'> = ['TODOS', 'ACTIVO', 'INACTIVO'];

  movimientos: ReporteMovimientosResponse[] = [];
  stock: ReporteStockResponse[] = [];
  stockCritico: ReporteStockCriticoResponse[] = [];
  valorizacion: ReporteValorizacionResponse | null = null;

  readonly filtrosMovimientos;
  readonly filtrosStock;

  constructor(
    private fb: FormBuilder,
    private reportesService: ReportesService
  ) {
    this.filtrosMovimientos = this.fb.nonNullable.group({
      fechaInicio: [''],
      fechaFin: [''],
      tipo: ['TODOS' as TipoMovimiento | 'TODOS'],
      incluirAnulados: [false],
    });
    this.filtrosStock = this.fb.nonNullable.group({
      estado: ['TODOS' as EstadoInventario | 'TODOS'],
      busqueda: [''],
    });
    this.cargarReportes();
  }

  get totalEntradas(): number {
    return this.movimientos
      .filter((movimiento) => movimiento.tipo === 'ENTRADA' && !movimiento.anulado)
      .reduce((total, movimiento) => total + movimiento.cantidad, 0);
  }

  get totalSalidas(): number {
    return this.movimientos
      .filter((movimiento) => movimiento.tipo === 'SALIDA' && !movimiento.anulado)
      .reduce((total, movimiento) => total + movimiento.cantidad, 0);
  }

  get totalAjustes(): number {
    return this.movimientos
      .filter((movimiento) => movimiento.tipo === 'AJUSTE' && !movimiento.anulado)
      .reduce((total, movimiento) => total + movimiento.cantidad, 0);
  }

  cargarReportes(): void {
    this.estado = 'cargando';
    this.error = '';

    forkJoin({
      movimientos: this.reportesService.movimientos(this.filtrosMovimientoRequest()),
      stock: this.reportesService.stock(this.filtrosStockRequest()),
      stockCritico: this.reportesService.stockCritico(),
      valorizacion: this.reportesService.valorizacion(),
    }).subscribe({
      next: ({ movimientos, stock, stockCritico, valorizacion }) => {
        this.movimientos = movimientos;
        this.stock = stock;
        this.stockCritico = stockCritico;
        this.valorizacion = valorizacion;
        this.estado = 'exito';
      },
      error: (error: unknown) => {
        this.estado = 'error';
        this.error = getApiErrorMessage(error);
      },
    });
  }

  aplicarFiltrosMovimientos(): void {
    this.estado = 'cargando';
    this.reportesService.movimientos(this.filtrosMovimientoRequest()).subscribe({
      next: (movimientos) => {
        this.movimientos = movimientos;
        this.estado = 'exito';
      },
      error: (error: unknown) => {
        this.estado = 'error';
        this.error = getApiErrorMessage(error);
      },
    });
  }

  aplicarFiltrosStock(): void {
    this.estado = 'cargando';
    this.reportesService.stock(this.filtrosStockRequest()).subscribe({
      next: (stock) => {
        this.stock = stock;
        this.estado = 'exito';
      },
      error: (error: unknown) => {
        this.estado = 'error';
        this.error = getApiErrorMessage(error);
      },
    });
  }

  limpiarFiltrosMovimientos(): void {
    this.filtrosMovimientos.reset({
      fechaInicio: '',
      fechaFin: '',
      tipo: 'TODOS',
      incluirAnulados: false,
    });
    this.aplicarFiltrosMovimientos();
  }

  limpiarFiltrosStock(): void {
    this.filtrosStock.reset({
      estado: 'TODOS',
      busqueda: '',
    });
    this.aplicarFiltrosStock();
  }

  movimientoClase(tipo: TipoMovimiento): string {
    if (tipo === 'ENTRADA') return 'bg-green-100 text-green-700';
    if (tipo === 'SALIDA') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-600';
  }

  stockClase(item: ReporteStockResponse): string {
    return item.stockCritico ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';
  }

  private filtrosMovimientoRequest() {
    const filtros = this.filtrosMovimientos.getRawValue();
    return {
      fechaInicio: filtros.fechaInicio || null,
      fechaFin: filtros.fechaFin || null,
      tipo: filtros.tipo === 'TODOS' ? null : filtros.tipo,
      incluirAnulados: filtros.incluirAnulados,
    };
  }

  private filtrosStockRequest() {
    const filtros = this.filtrosStock.getRawValue();
    return {
      estado: filtros.estado === 'TODOS' ? null : filtros.estado,
      busqueda: filtros.busqueda.trim() || null,
    };
  }
}
