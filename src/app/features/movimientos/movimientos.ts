import { DatePipe } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { getApiErrorMessage } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { ConfirmacionService } from '../../core/confirmacion.service';
import { descargarBlob, nombreArchivoExportacion } from '../../core/descarga-archivo';
import { EstadoCarga } from '../../core/estado-carga';
import { AccionDebounced, crearAccionDebounced, FiltroTodos, listarTodasLasPaginas } from '../../core/listado-utils';
import {
  calcularStockFinalMovimiento,
  diferenciaAjusteMovimiento,
  estaEnRangoMovimiento,
  MOVIMIENTO_STOCK_MAXIMO,
  salidaSuperaStock,
} from '../../core/movimiento-stock';
import { InventarioResponse, MovimientoResponse, ProductoResponse, ProveedorResponse, TipoMovimiento } from '../../core/models';
import { NotificacionService } from '../../core/notificacion.service';
import { InventarioService } from '../inventario/inventario.service';
import { ProductosService } from '../productos/productos.service';
import { ProveedoresService } from '../proveedores/proveedores.service';
import { MovimientosService } from './movimientos.service';

@Component({
  host: { class: 'flex-1 flex flex-col overflow-hidden min-h-0' },
  selector: 'app-movimientos',
  imports: [ReactiveFormsModule, FormsModule, DatePipe],
  templateUrl: './movimientos.html',
  styleUrl: './movimientos.scss',
})
export class Movimientos implements OnDestroy {
  readonly pageSize = 10;
  mensaje = '';
  errorListado = '';
  estadoListado: EstadoCarga = 'inicial';
  enviando = false;
  mostrarModal = false;
  busquedaProducto = '';
  dropdownProductoAbierto = false;
  productoSeleccionado: ProductoResponse | null = null;

  movimientos: MovimientoResponse[] = [];
  productos: ProductoResponse[] = [];
  proveedores: ProveedorResponse[] = [];
  inventarios: InventarioResponse[] = [];
  filtrosMovimiento = {
    busqueda: '',
    tipo: 'TODOS' as FiltroTodos<TipoMovimiento>,
    estado: 'TODOS' as FiltroTodos<'VIGENTE' | 'ANULADO'>,
  };

  readonly tiposMovimiento: TipoMovimiento[] = ['ENTRADA', 'SALIDA', 'AJUSTE'];
  readonly tiposMovimientoFiltro: Array<FiltroTodos<TipoMovimiento>> = ['TODOS', ...this.tiposMovimiento];
  readonly estadosMovimientoFiltro: Array<FiltroTodos<'VIGENTE' | 'ANULADO'>> = ['TODOS', 'VIGENTE', 'ANULADO'];
  readonly valorMaximoMovimiento = MOVIMIENTO_STOCK_MAXIMO;
  readonly movimientoForm;
  paginaActual = 0;
  totalPaginas = 0;
  totalRegistros = 0;
  private readonly busquedaDebounced: AccionDebounced = crearAccionDebounced(() => this.irAPagina(0));

  constructor(
    private fb: FormBuilder,
    private movimientosService: MovimientosService,
    private productosService: ProductosService,
    private proveedoresService: ProveedoresService,
    private inventarioService: InventarioService,
    public auth: AuthService,
    private confirmacion: ConfirmacionService,
    private notificacion: NotificacionService
  ) {
    this.movimientoForm = this.fb.nonNullable.group({
      tipo: ['ENTRADA' as TipoMovimiento, [Validators.required]],
      productoId: ['', [Validators.required]],
      proveedorId: [''],
      cantidad: [1, [Validators.required, Validators.min(1), Validators.max(MOVIMIENTO_STOCK_MAXIMO)]],
      stockDestino: [1, [Validators.required, Validators.min(1), Validators.max(MOVIMIENTO_STOCK_MAXIMO)]],
      motivo: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(255)]],
    });
    this.movimientoForm.controls.tipo.valueChanges.subscribe((tipo) => {
      this.configurarTipoMovimiento(tipo);
    });
    this.configurarTipoMovimiento('ENTRADA');
    this.cargarDatos();
  }

  get productosActivos(): ProductoResponse[] {
    const productosConInventarioActivo = new Set(this.inventarios.map((inventario) => inventario.productoId));
    return this.productos.filter((producto) => producto.estado === 'ACTIVO' && productosConInventarioActivo.has(producto.id));
  }

  get proveedoresActivos(): ProveedorResponse[] {
    return this.proveedores.filter((proveedor) => proveedor.estado === 'ACTIVO');
  }

  get productosFiltradosSelector(): ProductoResponse[] {
    const texto = this.normalizarBusqueda(this.busquedaProducto);
    if (!texto) return this.productosActivos;

    return this.productosActivos.filter((producto) => {
      const contenido = this.normalizarBusqueda(`${producto.nombre} ${producto.sku}`);
      return contenido.includes(texto);
    });
  }

  get puedeGuardar(): boolean {
    const value = this.movimientoForm.getRawValue();
    const requiereProveedor = value.tipo === 'ENTRADA';
    const requiereStockDestino = value.tipo === 'AJUSTE';
    return (
      this.movimientoForm.valid &&
      !this.enviando &&
      !!this.productoSeleccionado &&
      this.stockActualSeleccionado !== null &&
      this.stockFinalProyectado !== null &&
      this.stockFinalProyectado >= 0 &&
      !this.valorMovimientoFueraDeRango &&
      !this.salidaExcedeStock &&
      !this.ajusteSinCambio &&
      (!requiereProveedor || !!value.proveedorId) &&
      (!requiereStockDestino || value.stockDestino >= 1)
    );
  }

  get inventarioSeleccionado(): InventarioResponse | null {
    const productoId = this.movimientoForm.controls.productoId.value;
    if (!productoId) return null;
    return this.inventarios.find((inventario) => inventario.productoId === productoId) ?? null;
  }

  get stockActualSeleccionado(): number | null {
    return this.inventarioSeleccionado?.stockActual ?? null;
  }

  get stockFinalProyectado(): number | null {
    const stockActual = this.stockActualSeleccionado;
    if (stockActual === null) return null;

    const { tipo, cantidad, stockDestino } = this.movimientoForm.getRawValue();
    return calcularStockFinalMovimiento(
      tipo,
      stockActual,
      Number(cantidad ?? 0),
      Number(stockDestino ?? 0)
    );
  }

  get diferenciaAjuste(): number | null {
    if (this.movimientoForm.controls.tipo.value !== 'AJUSTE' || this.stockActualSeleccionado === null) return null;
    return diferenciaAjusteMovimiento(this.stockActualSeleccionado, Number(this.movimientoForm.controls.stockDestino.value ?? 0));
  }

  get salidaExcedeStock(): boolean {
    const stockActual = this.stockActualSeleccionado;
    return this.movimientoForm.controls.tipo.value === 'SALIDA'
      && stockActual !== null
      && salidaSuperaStock(stockActual, Number(this.movimientoForm.controls.cantidad.value ?? 0));
  }

  get ajusteSinCambio(): boolean {
    return this.movimientoForm.controls.tipo.value === 'AJUSTE' && this.diferenciaAjuste === 0;
  }

  get valorMovimientoFueraDeRango(): boolean {
    const value = this.movimientoForm.controls.tipo.value === 'AJUSTE'
      ? Number(this.movimientoForm.controls.stockDestino.value ?? 0)
      : Number(this.movimientoForm.controls.cantidad.value ?? 0);
    return !estaEnRangoMovimiento(value);
  }

  cargarDatos(): void {
    this.estadoListado = 'cargando';
    this.errorListado = '';
    forkJoin({
      movimientos: this.movimientosService.listar({
        page: this.paginaActual,
        size: this.pageSize,
        busqueda: this.filtrosMovimiento.busqueda,
        tipo: this.filtrosMovimiento.tipo,
        anulado:
          this.filtrosMovimiento.estado === 'TODOS'
            ? undefined
            : this.filtrosMovimiento.estado === 'ANULADO',
      }),
      productos: listarTodasLasPaginas((page, size) => this.productosService.listar({ page, size })),
      proveedores: listarTodasLasPaginas((page, size) => this.proveedoresService.listar({ page, size })),
      inventarios: listarTodasLasPaginas((page, size) => this.inventarioService.listar({ page, size, estado: 'ACTIVO' })),
    }).subscribe({
      next: ({ movimientos, productos, proveedores, inventarios }) => {
        this.movimientos = movimientos.content;
        this.paginaActual = movimientos.page;
        this.totalPaginas = movimientos.totalPages;
        this.totalRegistros = movimientos.totalElements;
        this.productos = productos;
        this.proveedores = proveedores;
        this.inventarios = inventarios;
        this.estadoListado = 'exito';
      },
      error: (error: unknown) => {
        this.estadoListado = 'error';
        this.errorListado = getApiErrorMessage(error);
      },
    });
  }

  abrirModal(): void {
    this.mostrarModal = true;
    this.sincronizarSelectorProducto();
  }

  bloquearTeclasNumeroInvalido(event: KeyboardEvent): void {
    if (['e', 'E', '+', '-'].includes(event.key)) event.preventDefault();
  }

  limpiarFiltrosMovimientos(): void {
    this.filtrosMovimiento = {
      busqueda: '',
      tipo: 'TODOS',
      estado: 'TODOS',
    };
    this.irAPagina(0);
  }

  onFiltrosChange(): void {
    this.irAPagina(0);
  }

  onBusquedaChange(): void {
    this.busquedaDebounced.schedule();
  }

  ngOnDestroy(): void {
    this.busquedaDebounced.destroy();
  }

  irAPagina(page: number): void {
    if (page < 0 || (this.totalPaginas > 0 && page >= this.totalPaginas)) return;
    this.paginaActual = page;
    this.cargarDatos();
  }

  exportarMovimientosExcel(): void {
    this.exportarMovimientos('excel');
  }

  exportarMovimientosPdf(): void {
    this.exportarMovimientos('pdf');
  }

  async registrarMovimiento(): Promise<void> {
    if (this.enviando) return;
    if (!this.puedeGuardar) {
      this.movimientoForm.markAllAsTouched();
      this.notificacion.error(this.mensajeValidacionMovimiento());
      return;
    }

    const value = this.movimientoForm.getRawValue();
    const confirmado = await this.confirmacion.confirmar({
      titulo: `Confirmar ${value.tipo.toLowerCase()}`,
      mensaje: this.mensajeConfirmacionRegistro(),
      textoConfirmar: 'Registrar',
      tono: value.tipo === 'SALIDA' ? 'danger' : 'normal',
    });
    if (!confirmado) return;

    const usuarioId = this.usuarioSesionId();
    if (!usuarioId) {
      this.notificacion.error('Inicia sesión para registrar movimientos.');
      return;
    }

    this.enviando = true;
    this.movimientosService
      .registrar({
        productoId: value.productoId,
        proveedorId: value.tipo === 'ENTRADA' ? value.proveedorId : null,
        usuarioId,
        tipo: value.tipo,
        cantidad: value.tipo === 'AJUSTE' ? null : value.cantidad,
        stockDestino: value.tipo === 'AJUSTE' ? value.stockDestino : null,
        motivo: value.motivo.trim().replace(/\s{2,}/g, ' '),
      })
      .subscribe({
        next: () => {
          this.enviando = false;
          this.notificacion.success('Movimiento registrado correctamente.');
          this.cerrarModal();
          this.cargarDatos();
        },
        error: (error: unknown) => {
          this.enviando = false;
          this.notificacion.error(getApiErrorMessage(error));
        },
      });
  }

  async anularMovimiento(movimiento: MovimientoResponse): Promise<void> {
    const confirmado = await this.confirmacion.confirmar({
      titulo: 'Anular movimiento',
      mensaje: `Se va a anular el movimiento ${movimiento.tipo} de ${movimiento.productoNombre}. Esta accion revierte el stock asociado.`,
      textoConfirmar: 'Anular',
      tono: 'danger',
    });
    if (!confirmado) return;

    const usuarioId = this.usuarioSesionId();
    if (!usuarioId) {
      this.notificacion.error('Inicia sesión para anular movimientos.');
      return;
    }

    this.movimientosService
      .anular(movimiento.id, {
        usuarioId,
        motivoAnulacion: `Anulación confirmada desde movimientos: ${movimiento.tipo} ${movimiento.productoNombre}`.slice(0, 255),
      })
      .subscribe({
        next: () => {
          this.notificacion.success('Movimiento anulado correctamente.');
          this.cargarDatos();
        },
        error: (error: unknown) => {
          this.notificacion.error(getApiErrorMessage(error));
        },
      });
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.movimientoForm.reset({
      tipo: 'ENTRADA',
      productoId: '',
      proveedorId: '',
      cantidad: 1,
      stockDestino: 1,
      motivo: '',
    });
    this.configurarTipoMovimiento('ENTRADA');
    this.resetearSelectorProducto();
  }

  abrirDropdownProducto(): void {
    this.dropdownProductoAbierto = true;
    if (!this.busquedaProducto && this.productoSeleccionado) {
      this.busquedaProducto = this.textoProducto(this.productoSeleccionado);
    }
  }

  onBusquedaProductoChange(valor: string): void {
    this.busquedaProducto = valor;
    this.dropdownProductoAbierto = true;

    if (this.productoSeleccionado && valor !== this.textoProducto(this.productoSeleccionado)) {
      this.productoSeleccionado = null;
      this.movimientoForm.controls.productoId.setValue('');
    }
  }

  seleccionarProducto(producto: ProductoResponse): void {
    this.productoSeleccionado = producto;
    this.busquedaProducto = this.textoProducto(producto);
    this.movimientoForm.controls.productoId.setValue(producto.id);
    this.movimientoForm.controls.productoId.markAsDirty();
    this.dropdownProductoAbierto = false;
  }

  limpiarProductoSeleccionado(): void {
    this.resetearSelectorProducto();
    this.movimientoForm.controls.productoId.markAsTouched();
  }

  onProductoSelectorFocusOut(event: FocusEvent): void {
    const siguiente = event.relatedTarget;
    if (siguiente instanceof Node && event.currentTarget instanceof Node && event.currentTarget.contains(siguiente)) {
      return;
    }

    setTimeout(() => {
      if (!this.productoSeleccionado) {
        this.busquedaProducto = '';
      } else {
        this.busquedaProducto = this.textoProducto(this.productoSeleccionado);
      }
      this.dropdownProductoAbierto = false;
    });
  }

  productoSeleccionadoEs(productoId: string): boolean {
    return this.productoSeleccionado?.id === productoId;
  }

  inventariosPorProducto(productoId: string): InventarioResponse | null {
    return this.inventarios.find((inventario) => inventario.productoId === productoId) ?? null;
  }

  movimientoClase(type: TipoMovimiento): string {
    if (type === 'ENTRADA') return 'bg-green-100 text-green-700';
    if (type === 'SALIDA') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-600';
  }

  estaAnulado(movimiento: MovimientoResponse): boolean {
    return !!movimiento.anuladoEn;
  }

  estadoMovimiento(movimiento: MovimientoResponse): 'VIGENTE' | 'ANULADO' {
    return this.estaAnulado(movimiento) ? 'ANULADO' : 'VIGENTE';
  }

  productoPorId(productoId: string): ProductoResponse | null {
    return this.productos.find((producto) => producto.id === productoId) ?? null;
  }

  productoDescripcion(movimiento: MovimientoResponse): string {
    return this.productoPorId(movimiento.productoId)?.descripcion?.trim() || 'Sin descripción registrada.';
  }

  productoImagen(movimiento: MovimientoResponse): string | null {
    return this.productoPorId(movimiento.productoId)?.imagenUrl?.trim() || null;
  }

  onImagenProductoError(movimiento: MovimientoResponse): void {
    const producto = this.productoPorId(movimiento.productoId);
    if (producto) producto.imagenUrl = '';
  }

  private configurarTipoMovimiento(tipo: TipoMovimiento): void {
    if (tipo === 'ENTRADA') {
      this.movimientoForm.controls.proveedorId.enable({ emitEvent: false });
    } else {
      this.movimientoForm.controls.proveedorId.setValue('', { emitEvent: false });
      this.movimientoForm.controls.proveedorId.disable({ emitEvent: false });
    }

    if (tipo === 'AJUSTE') {
      this.movimientoForm.controls.stockDestino.enable({ emitEvent: false });
      this.movimientoForm.controls.cantidad.disable({ emitEvent: false });
    } else {
      this.movimientoForm.controls.stockDestino.setValue(1, { emitEvent: false });
      this.movimientoForm.controls.stockDestino.disable({ emitEvent: false });
      this.movimientoForm.controls.cantidad.enable({ emitEvent: false });
    }
  }

  private mensajeValidacionMovimiento(): string {
    if (!this.productoSeleccionado) return 'Selecciona un producto con inventario activo.';
    if (this.stockActualSeleccionado === null) return 'El producto seleccionado no tiene inventario activo.';
    if (this.valorMovimientoFueraDeRango) return `Ingresa un valor entre 1 y ${MOVIMIENTO_STOCK_MAXIMO}.`;
    if (this.salidaExcedeStock) return 'La salida no puede superar el stock actual.';
    if (this.ajusteSinCambio) return 'El ajuste debe cambiar el stock actual.';
    return 'Completa correctamente los campos obligatorios.';
  }

  private mensajeConfirmacionRegistro(): string {
    const value = this.movimientoForm.getRawValue();
    const producto = this.productoSeleccionado?.nombre ?? 'el producto seleccionado';
    const stockActual = this.stockActualSeleccionado ?? 0;
    const stockFinal = this.stockFinalProyectado ?? 0;
    if (value.tipo === 'AJUSTE') {
      return `Se ajustará ${producto}: stock actual ${stockActual}, stock final ${stockFinal}.`;
    }
    return `Se registrará una ${value.tipo.toLowerCase()} de ${value.cantidad} unidad(es) para ${producto}: stock actual ${stockActual}, stock final ${stockFinal}.`;
  }

  private usuarioSesionId(): string | null {
    return this.auth.session()?.id ?? null;
  }

  private resetearSelectorProducto(): void {
    this.busquedaProducto = '';
    this.dropdownProductoAbierto = false;
    this.productoSeleccionado = null;
  }

  private sincronizarSelectorProducto(): void {
    const productoId = this.movimientoForm.controls.productoId.value;
    this.productoSeleccionado = this.productosActivos.find((producto) => producto.id === productoId) ?? null;
    this.busquedaProducto = this.productoSeleccionado ? this.textoProducto(this.productoSeleccionado) : '';
    this.dropdownProductoAbierto = false;
  }

  private textoProducto(producto: ProductoResponse): string {
    return `${producto.nombre} - ${producto.sku}`;
  }

  private normalizarBusqueda(value: string): string {
    return value.trim().toLowerCase();
  }

  private exportarMovimientos(tipo: 'excel' | 'pdf'): void {
    this.movimientosService.exportar(tipo, {
      busqueda: this.filtrosMovimiento.busqueda,
      tipo: this.filtrosMovimiento.tipo,
      anulado: this.filtrosMovimiento.estado === 'TODOS' ? undefined : this.filtrosMovimiento.estado === 'ANULADO',
    }).subscribe({
      next: (blob) => {
        descargarBlob(blob, nombreArchivoExportacion('movimientos', tipo));
        this.notificacion.success(`Movimientos exportados a ${tipo === 'excel' ? 'Excel' : 'PDF'}.`);
      },
      error: (error: unknown) => this.notificacion.error(getApiErrorMessage(error)),
    });
  }
}
