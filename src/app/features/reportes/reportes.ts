import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { getApiErrorMessage } from '../../core/api-error';
import { nombreArchivoExportacion } from '../../core/descarga-archivo';
import { EstadoCarga } from '../../core/estado-carga';
import { ColumnaExportacion, ExportacionSinDatosError, exportarExcel, exportarPdf } from '../../core/exportacion';
import { AccionDebounced, crearAccionDebounced, paginarLocal } from '../../core/listado-utils';
import {
  EstadoInventario,
  ReporteMovimientosResponse,
  ReporteStockCriticoResponse,
  ReporteStockResponse,
  ReporteValorizacionItemResponse,
  ReporteValorizacionResponse,
  TipoMovimiento,
} from '../../core/models';
import { NotificacionService } from '../../core/notificacion.service';
import { ReportesService } from './reportes.service';

type PestanaReporte = 'movimientos' | 'stock' | 'critico' | 'valorizacion';

@Component({
  host: { class: 'flex-1 flex flex-col overflow-hidden min-h-0' },
  selector: 'app-reportes',
  imports: [ReactiveFormsModule, DatePipe, DecimalPipe, CurrencyPipe],
  templateUrl: './reportes.html',
  styleUrl: './reportes.scss',
})
export class Reportes implements OnDestroy {
  readonly pageSize = 10;
  pestanaActiva: PestanaReporte = 'movimientos';
  estado: EstadoCarga = 'inicial';
  error = '';

  readonly tiposMovimiento: Array<TipoMovimiento | 'TODOS'> = ['TODOS', 'ENTRADA', 'SALIDA', 'AJUSTE'];
  readonly estadosInventario: Array<EstadoInventario | 'TODOS'> = ['TODOS', 'ACTIVO', 'INACTIVO'];

  movimientos: ReporteMovimientosResponse[] = [];
  stock: ReporteStockResponse[] = [];
  stockCritico: ReporteStockCriticoResponse[] = [];
  valorizacion: ReporteValorizacionResponse | null = null;
  paginaMovimientos = 0;
  paginaStock = 0;
  paginaCritico = 0;
  paginaValorizacion = 0;

  readonly filtrosMovimientos;
  readonly filtrosStock;
  private suspendiendoFiltros = false;
  private readonly busquedaStockDebounced: AccionDebounced = crearAccionDebounced(() => this.aplicarFiltrosStock());

  constructor(
    private fb: FormBuilder,
    private reportesService: ReportesService,
    private notificacion: NotificacionService
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
    this.filtrosMovimientos.valueChanges.subscribe(() => {
      if (!this.suspendiendoFiltros) this.aplicarFiltrosMovimientos();
    });
    this.filtrosStock.controls.estado.valueChanges.subscribe(() => {
      if (!this.suspendiendoFiltros) this.aplicarFiltrosStock();
    });
    this.filtrosStock.controls.busqueda.valueChanges.subscribe(() => {
      if (!this.suspendiendoFiltros) this.busquedaStockDebounced.schedule();
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

  get movimientosPaginados(): ReporteMovimientosResponse[] {
    return paginarLocal(this.movimientos, this.paginaMovimientos, this.pageSize);
  }

  get stockPaginado(): ReporteStockResponse[] {
    return paginarLocal(this.stock, this.paginaStock, this.pageSize);
  }

  get stockCriticoPaginado(): ReporteStockCriticoResponse[] {
    return paginarLocal(this.stockCritico, this.paginaCritico, this.pageSize);
  }

  get valorizacionItems(): NonNullable<ReporteValorizacionResponse['items']> {
    return this.valorizacion?.items ?? [];
  }

  get valorizacionPaginada(): NonNullable<ReporteValorizacionResponse['items']> {
    return paginarLocal(this.valorizacionItems, this.paginaValorizacion, this.pageSize);
  }

  totalPaginas(total: number): number {
    return Math.ceil(total / this.pageSize);
  }

  textoPagina(page: number, total: number): string {
    const totalPaginas = this.totalPaginas(total);
    return `Página ${totalPaginas === 0 ? 0 : page + 1} de ${totalPaginas}`;
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
        this.resetearPaginas();
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
    this.paginaMovimientos = 0;
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
    this.paginaStock = 0;
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
    this.suspendiendoFiltros = true;
    this.filtrosMovimientos.reset({
      fechaInicio: '',
      fechaFin: '',
      tipo: 'TODOS',
      incluirAnulados: false,
    });
    this.suspendiendoFiltros = false;
    this.aplicarFiltrosMovimientos();
  }

  limpiarFiltrosStock(): void {
    this.suspendiendoFiltros = true;
    this.filtrosStock.reset({
      estado: 'TODOS',
      busqueda: '',
    });
    this.suspendiendoFiltros = false;
    this.aplicarFiltrosStock();
  }

  exportarReporteExcel(): void {
    this.exportarReporte('excel');
  }

  exportarReportePdf(): void {
    this.exportarReporte('pdf');
  }

  ngOnDestroy(): void {
    this.busquedaStockDebounced.destroy();
  }

  movimientoClase(tipo: TipoMovimiento): string {
    if (tipo === 'ENTRADA') return 'bg-green-100 text-green-700';
    if (tipo === 'SALIDA') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-600';
  }

  stockClase(item: ReporteStockResponse): string {
    return item.stockCritico ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';
  }

  irAPaginaMovimientos(page: number): void {
    if (this.paginaValida(page, this.movimientos.length)) this.paginaMovimientos = page;
  }

  irAPaginaStock(page: number): void {
    if (this.paginaValida(page, this.stock.length)) this.paginaStock = page;
  }

  irAPaginaCritico(page: number): void {
    if (this.paginaValida(page, this.stockCritico.length)) this.paginaCritico = page;
  }

  irAPaginaValorizacion(page: number): void {
    if (this.paginaValida(page, this.valorizacionItems.length)) this.paginaValorizacion = page;
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

  private paginaValida(page: number, total: number): boolean {
    return page >= 0 && page < this.totalPaginas(total);
  }

  private resetearPaginas(): void {
    this.paginaMovimientos = 0;
    this.paginaStock = 0;
    this.paginaCritico = 0;
    this.paginaValorizacion = 0;
  }

  private exportarReporte(tipo: 'excel' | 'pdf'): void {
    try {
      const { titulo, modulo, items, columnas } = this.configuracionExportacion();
      const archivo = nombreArchivoExportacion(modulo, tipo).replace(/\.(xls|pdf)$/i, '');
      if (tipo === 'excel') exportarExcel(titulo, archivo, items, columnas);
      else exportarPdf(titulo, archivo, items, columnas);
      this.notificacion.success(`${titulo} exportado a ${tipo === 'excel' ? 'Excel' : 'PDF'}.`);
    } catch (error) {
      if (error instanceof ExportacionSinDatosError) this.notificacion.info(error.message);
      else this.notificacion.error('No se pudo exportar el reporte.');
    }
  }

  private configuracionExportacion(): {
    titulo: string;
    modulo: string;
    items: readonly object[];
    columnas: readonly ColumnaExportacion<object>[];
  } {
    if (this.pestanaActiva === 'movimientos') {
      return {
        titulo: 'Reporte de movimientos',
        modulo: 'reporte movimientos',
        items: this.movimientos,
        columnas: [
          { encabezado: 'Fecha', valor: (item) => (item as ReporteMovimientosResponse).fecha },
          { encabezado: 'Producto', valor: (item) => (item as ReporteMovimientosResponse).productoNombre },
          { encabezado: 'SKU', valor: (item) => (item as ReporteMovimientosResponse).productoSku },
          { encabezado: 'Tipo', valor: (item) => (item as ReporteMovimientosResponse).tipo },
          { encabezado: 'Cantidad', valor: (item) => (item as ReporteMovimientosResponse).cantidad },
          { encabezado: 'Stock antes', valor: (item) => (item as ReporteMovimientosResponse).stockAntes },
          { encabezado: 'Stock después', valor: (item) => (item as ReporteMovimientosResponse).stockDespues },
          { encabezado: 'Usuario', valor: (item) => (item as ReporteMovimientosResponse).creadoPorNombre },
          { encabezado: 'Estado', valor: (item) => ((item as ReporteMovimientosResponse).anulado ? 'ANULADO' : 'VIGENTE') },
        ],
      };
    }
    if (this.pestanaActiva === 'stock') {
      return {
        titulo: 'Reporte de stock',
        modulo: 'reporte stock',
        items: this.stock,
        columnas: this.columnasStock(),
      };
    }
    if (this.pestanaActiva === 'critico') {
      return {
        titulo: 'Reporte de stock crítico',
        modulo: 'reporte stock crítico',
        items: this.stockCritico,
        columnas: [
          { encabezado: 'Producto', valor: (item) => (item as ReporteStockCriticoResponse).productoNombre },
          { encabezado: 'SKU', valor: (item) => (item as ReporteStockCriticoResponse).productoSku },
          { encabezado: 'Stock actual', valor: (item) => (item as ReporteStockCriticoResponse).stockActual },
          { encabezado: 'Stock mínimo', valor: (item) => (item as ReporteStockCriticoResponse).stockMinimo },
          { encabezado: 'Cantidad sugerida', valor: (item) => (item as ReporteStockCriticoResponse).cantidadSugerida },
          { encabezado: 'Ubicación', valor: (item) => (item as ReporteStockCriticoResponse).ubicacion },
        ],
      };
    }
    return {
      titulo: 'Reporte de valorización',
      modulo: 'reporte valorización',
      items: this.valorizacionItems,
      columnas: [
        { encabezado: 'Producto', valor: (item) => (item as ReporteValorizacionItemResponse).productoNombre },
        { encabezado: 'SKU', valor: (item) => (item as ReporteValorizacionItemResponse).productoSku },
        { encabezado: 'Stock', valor: (item) => (item as ReporteValorizacionItemResponse).stockActual },
        { encabezado: 'Compra', valor: (item) => (item as ReporteValorizacionItemResponse).precioCompra },
        { encabezado: 'Venta', valor: (item) => (item as ReporteValorizacionItemResponse).precioVenta },
        { encabezado: 'Valor costo', valor: (item) => (item as ReporteValorizacionItemResponse).valorCosto },
        { encabezado: 'Valor venta', valor: (item) => (item as ReporteValorizacionItemResponse).valorVenta },
        { encabezado: 'Margen', valor: (item) => (item as ReporteValorizacionItemResponse).margenEstimado },
      ],
    };
  }

  private columnasStock(): readonly ColumnaExportacion<object>[] {
    return [
      { encabezado: 'Producto', valor: (item) => (item as ReporteStockResponse).productoNombre },
      { encabezado: 'SKU', valor: (item) => (item as ReporteStockResponse).productoSku },
      { encabezado: 'Categoría', valor: (item) => (item as ReporteStockResponse).categoriaNombre },
      { encabezado: 'Marca', valor: (item) => (item as ReporteStockResponse).marcaNombre },
      { encabezado: 'Stock actual', valor: (item) => (item as ReporteStockResponse).stockActual },
      { encabezado: 'Stock mínimo', valor: (item) => (item as ReporteStockResponse).stockMinimo },
      { encabezado: 'Ubicación', valor: (item) => (item as ReporteStockResponse).ubicacion },
      { encabezado: 'Estado', valor: (item) => (item as ReporteStockResponse).estado },
    ];
  }
}
