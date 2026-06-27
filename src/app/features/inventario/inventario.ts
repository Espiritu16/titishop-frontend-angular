import { DatePipe } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { getApiErrorMessage } from '../../core/api-error';
import { hayCambios, normalizarSnapshot } from '../../core/cambios-formulario';
import { ConfirmacionService } from '../../core/confirmacion.service';
import { descargarBlob, nombreArchivoExportacion } from '../../core/descarga-archivo';
import { EstadoCarga } from '../../core/estado-carga';
import { AccionDebounced, crearAccionDebounced, FiltroTodos, listarTodasLasPaginas } from '../../core/listado-utils';
import { EstadoInventario, EstadoProducto, EstadoStockInventario, InventarioResponse, ProductoResponse } from '../../core/models';
import { NotificacionService } from '../../core/notificacion.service';
import { ProductosService } from '../productos/productos.service';
import { InventarioService } from './inventario.service';

@Component({
  host: { class: 'flex-1 flex flex-col overflow-hidden min-h-0' },
  selector: 'app-inventario',
  imports: [ReactiveFormsModule, FormsModule, DatePipe],
  templateUrl: './inventario.html',
  styleUrl: './inventario.scss',
})
export class Inventario implements OnDestroy {
  readonly pageSize = 10;
  mensaje = '';
  errorListado = '';
  estadoListado: EstadoCarga = 'inicial';
  editandoId: string | null = null;
  inventarios: InventarioResponse[] = [];
  productos: ProductoResponse[] = [];
  busquedaProducto = '';
  dropdownProductoAbierto = false;
  productoSeleccionado: ProductoResponse | null = null;
  mostrarModal = false;
  enviando = false;
  inventarioSnapshotOriginal: Record<string, string | number | boolean | null> | null = null;
  filtrosInventario = {
    busqueda: '',
    estado: 'TODOS' as FiltroTodos<EstadoInventario>,
    stock: 'TODOS' as FiltroTodos<EstadoStockInventario>,
  };

  readonly inventarioForm;
  readonly estadosInventario: Array<FiltroTodos<EstadoInventario>> = ['TODOS', 'ACTIVO', 'INACTIVO'];
  readonly estadosStock: Array<FiltroTodos<EstadoStockInventario>> = ['TODOS', 'NORMAL', 'BAJO', 'AGOTADO'];
  paginaActual = 0;
  totalPaginas = 0;
  totalRegistros = 0;
  private readonly busquedaDebounced: AccionDebounced = crearAccionDebounced(() => this.irAPagina(0));

  constructor(
    private fb: FormBuilder,
    private inventarioService: InventarioService,
    private productosService: ProductosService,
    private confirmacion: ConfirmacionService,
    private notificacion: NotificacionService
  ) {
    this.inventarioForm = this.fb.nonNullable.group({
      productoId: ['', [Validators.required]],
      stockActual: [0, [Validators.required, Validators.min(0)]],
      stockMinimo: [0, [Validators.required, Validators.min(0)]],
      ubicacion: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(40)]],
    });
    this.cargarDatos();
  }

  get productosActivosSinInventario(): ProductoResponse[] {
    const productoIdsConInventario = new Set(this.inventarios.map((item) => item.productoId));
    return this.productos.filter(
      (producto) =>
        producto.estado === 'ACTIVO' &&
        (!productoIdsConInventario.has(producto.id) || producto.id === this.productoEditandoId())
    );
  }

  get productosFiltradosSelector(): ProductoResponse[] {
    const texto = this.normalizarBusqueda(this.busquedaProducto);
    if (!texto) return this.productosActivosSinInventario;
    return this.productosActivosSinInventario.filter((producto) =>
      this.normalizarBusqueda(`${producto.nombre} ${producto.sku}`).includes(texto)
    );
  }

  productoEstado(item: InventarioResponse): EstadoProducto | 'DESCONOCIDO' {
    return this.productos.find((producto) => producto.id === item.productoId)?.estado ?? 'DESCONOCIDO';
  }

  productoInactivo(item: InventarioResponse): boolean {
    return this.productoEstado(item) === 'INACTIVO';
  }

  cargarDatos(): void {
    this.estadoListado = 'cargando';
    this.errorListado = '';
    forkJoin({
      inventarios: this.inventarioService.listar({
        page: this.paginaActual,
        size: this.pageSize,
        busqueda: this.filtrosInventario.busqueda,
        estado: this.filtrosInventario.estado,
        stockEstado: this.filtrosInventario.stock,
      }),
      productos: listarTodasLasPaginas((page, size) => this.productosService.listar({ page, size })),
    }).subscribe({
      next: ({ inventarios, productos }) => {
        this.inventarios = inventarios.content;
        this.paginaActual = inventarios.page;
        this.totalPaginas = inventarios.totalPages;
        this.totalRegistros = inventarios.totalElements;
        this.productos = productos;
        this.estadoListado = 'exito';
      },
      error: (error: unknown) => {
        this.estadoListado = 'error';
        this.errorListado = getApiErrorMessage(error);
      },
    });
  }

  abrirModal(): void {
    this.cancelarEdicion();
    this.mostrarModal = true;
  }

  bloquearTeclasNumeroInvalido(event: KeyboardEvent): void {
    if (['e', 'E', '+', '-'].includes(event.key)) event.preventDefault();
  }

  limpiarFiltrosInventario(): void {
    this.filtrosInventario = {
      busqueda: '',
      estado: 'TODOS',
      stock: 'TODOS',
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

  exportarInventarioExcel(): void {
    this.exportarInventario('excel');
  }

  exportarInventarioPdf(): void {
    this.exportarInventario('pdf');
  }

  guardarInventario(): void {
    if (this.enviando) return;
    if (this.inventarioForm.invalid) {
      this.inventarioForm.markAllAsTouched();
      this.notificacion.error('Completa correctamente los campos obligatorios.');
      return;
    }

    const value = this.inventarioForm.getRawValue();
    const estadoActual = this.inventarios.find((item) => item.id === this.editandoId)?.estado ?? 'ACTIVO';
    if (this.editandoId) {
      const actual = normalizarSnapshot({
        stockMinimo: value.stockMinimo,
        ubicacion: this.normalizarTexto(value.ubicacion),
        estado: estadoActual,
      });
      if (this.inventarioSnapshotOriginal && !hayCambios(this.inventarioSnapshotOriginal, actual)) {
        this.notificacion.info('No hay cambios para actualizar.');
        return;
      }
    }

    this.enviando = true;
    const request$ = this.editandoId
      ? this.inventarioService.actualizar(this.editandoId, {
          stockMinimo: value.stockMinimo,
          ubicacion: this.normalizarTexto(value.ubicacion),
          estado: estadoActual,
        })
      : this.inventarioService.crear({
          productoId: value.productoId,
          stockActual: value.stockActual,
          stockMinimo: value.stockMinimo,
          ubicacion: this.normalizarTexto(value.ubicacion),
        });

    request$.subscribe({
      next: () => {
        this.enviando = false;
        this.notificacion.success(this.editandoId
          ? 'Inventario actualizado correctamente.'
          : 'Inventario creado correctamente.');
        this.cancelarEdicion();
        this.cargarDatos();
      },
      error: (error: unknown) => {
        this.enviando = false;
        this.notificacion.error(getApiErrorMessage(error));
      },
    });
  }

  editarInventario(item: InventarioResponse): void {
    this.editandoId = item.id;
    this.mostrarModal = true;
    this.inventarioForm.setValue({
      productoId: item.productoId,
      stockActual: item.stockActual,
      stockMinimo: item.stockMinimo,
      ubicacion: item.ubicacion,
    });
    this.inventarioForm.controls.productoId.disable({ emitEvent: false });
    this.inventarioForm.controls.stockActual.disable({ emitEvent: false });
    this.inventarioSnapshotOriginal = normalizarSnapshot({
      stockMinimo: item.stockMinimo,
      ubicacion: item.ubicacion,
      estado: item.estado,
    });
    this.sincronizarSelectorProducto();
    this.notificacion.info(`Editando inventario de ${item.productoNombre}.`);
  }

  cancelarEdicion(): void {
    this.mostrarModal = false;
    this.editandoId = null;
    this.inventarioSnapshotOriginal = null;
    this.inventarioForm.controls.productoId.enable({ emitEvent: false });
    this.inventarioForm.controls.stockActual.enable({ emitEvent: false });
    this.inventarioForm.reset({
      productoId: '',
      stockActual: 0,
      stockMinimo: 0,
      ubicacion: '',
    });
    this.resetearSelectorProducto();
  }

  abrirDropdownProducto(): void {
    if (this.inventarioForm.controls.productoId.disabled) return;
    this.dropdownProductoAbierto = true;
    if (!this.busquedaProducto && this.productoSeleccionado) {
      this.busquedaProducto = this.textoProducto(this.productoSeleccionado);
    }
  }

  onBusquedaProductoChange(valor: string): void {
    if (this.inventarioForm.controls.productoId.disabled) return;
    this.busquedaProducto = valor;
    this.dropdownProductoAbierto = true;
    if (this.productoSeleccionado && valor !== this.textoProducto(this.productoSeleccionado)) {
      this.productoSeleccionado = null;
      this.inventarioForm.controls.productoId.setValue('');
    }
  }

  seleccionarProducto(producto: ProductoResponse): void {
    this.productoSeleccionado = producto;
    this.busquedaProducto = this.textoProducto(producto);
    this.inventarioForm.controls.productoId.setValue(producto.id);
    this.inventarioForm.controls.productoId.markAsDirty();
    this.dropdownProductoAbierto = false;
  }

  limpiarProductoSeleccionado(): void {
    this.resetearSelectorProducto();
    this.inventarioForm.controls.productoId.setValue('');
    this.inventarioForm.controls.productoId.markAsTouched();
  }

  onProductoSelectorFocusOut(event: FocusEvent): void {
    const siguiente = event.relatedTarget;
    if (siguiente instanceof Node && event.currentTarget instanceof Node && event.currentTarget.contains(siguiente)) return;
    setTimeout(() => {
      this.busquedaProducto = this.productoSeleccionado ? this.textoProducto(this.productoSeleccionado) : '';
      this.dropdownProductoAbierto = false;
    });
  }

  productoSeleccionadoEs(productoId: string): boolean {
    return this.productoSeleccionado?.id === productoId;
  }

  async cambiarEstadoInventario(item: InventarioResponse): Promise<void> {
    const accion = item.estado === 'ACTIVO' ? 'desactivar' : 'activar';
    const confirmado = await this.confirmacion.confirmar({
      titulo: `${accion === 'desactivar' ? 'Desactivar' : 'Activar'} registro de inventario`,
      mensaje: accion === 'desactivar'
        ? `Se intentará desactivar solo el registro de inventario de ${item.productoNombre}. Si aún tiene stock, el backend lo rechazará para proteger el control físico.`
        : `Se activará nuevamente el registro de inventario de ${item.productoNombre}. El estado del producto de catálogo no se modifica.`,
      textoConfirmar: accion === 'desactivar' ? 'Desactivar' : 'Activar',
      tono: accion === 'desactivar' ? 'danger' : 'normal',
    });
    if (!confirmado) return;

    const request$: Observable<unknown> = this.inventarioService.actualizarEstado(
      item.id,
      item.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
    );

    request$.subscribe({
      next: () => {
        this.notificacion.success(
          item.estado === 'ACTIVO'
            ? 'Inventario desactivado correctamente.'
            : 'Inventario activado correctamente.');
        this.cargarDatos();
      },
      error: (error: unknown) => {
        this.notificacion.error(getApiErrorMessage(error));
      },
    });
  }

  estadoStock(item: InventarioResponse): EstadoStockInventario {
    if (item.stockActual <= 0) return 'AGOTADO';
    if (item.stockActual <= item.stockMinimo) return 'BAJO';
    return 'NORMAL';
  }

  stockClase(item: InventarioResponse): string {
    const estado = this.estadoStock(item);
    if (estado === 'AGOTADO') return 'bg-red-100 text-red-600';
    if (estado === 'BAJO') return 'bg-amber-100 text-amber-600';
    return 'bg-green-100 text-green-700';
  }

  estadoClase(status: EstadoInventario): string {
    return status === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500';
  }

  estadoProductoClase(status: EstadoProducto | 'DESCONOCIDO'): string {
    if (status === 'ACTIVO') return 'bg-green-100 text-green-700';
    if (status === 'INACTIVO') return 'bg-amber-100 text-amber-700';
    return 'bg-gray-100 text-gray-500';
  }

  productoPorId(productoId: string): ProductoResponse | null {
    return this.productos.find((producto) => producto.id === productoId) ?? null;
  }

  productoDescripcion(item: InventarioResponse): string {
    return this.productoPorId(item.productoId)?.descripcion?.trim() || 'Sin descripción registrada.';
  }

  productoImagen(item: InventarioResponse): string | null {
    return this.productoPorId(item.productoId)?.imagenUrl?.trim() || null;
  }

  onImagenProductoError(item: InventarioResponse): void {
    const producto = this.productoPorId(item.productoId);
    if (producto) producto.imagenUrl = '';
  }

  private productoEditandoId(): string | null {
    if (!this.editandoId) return null;
    return this.inventarios.find((item) => item.id === this.editandoId)?.productoId ?? null;
  }

  private normalizarTexto(value: string): string {
    return value.trim().replace(/\s{2,}/g, ' ');
  }

  private resetearSelectorProducto(): void {
    this.busquedaProducto = '';
    this.dropdownProductoAbierto = false;
    this.productoSeleccionado = null;
  }

  private sincronizarSelectorProducto(): void {
    const productoId = this.inventarioForm.getRawValue().productoId;
    this.productoSeleccionado = this.productos.find((producto) => producto.id === productoId) ?? null;
    this.busquedaProducto = this.productoSeleccionado ? this.textoProducto(this.productoSeleccionado) : '';
    this.dropdownProductoAbierto = false;
  }

  private textoProducto(producto: ProductoResponse): string {
    return `${producto.nombre} - ${producto.sku}`;
  }

  private normalizarBusqueda(value: string): string {
    return value.trim().toLowerCase();
  }

  private exportarInventario(tipo: 'excel' | 'pdf'): void {
    this.inventarioService.exportar(tipo, {
      busqueda: this.filtrosInventario.busqueda,
      estado: this.filtrosInventario.estado,
      stockEstado: this.filtrosInventario.stock,
    }).subscribe({
      next: (blob) => {
        descargarBlob(blob, nombreArchivoExportacion('inventario', tipo));
        this.notificacion.success(`Inventario exportado a ${tipo === 'excel' ? 'Excel' : 'PDF'}.`);
      },
      error: (error: unknown) => this.notificacion.error(getApiErrorMessage(error)),
    });
  }
}
