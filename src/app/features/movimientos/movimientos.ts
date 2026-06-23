import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { getApiErrorMessage } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { EstadoCarga } from '../../core/estado-carga';
import { FiltroTodos, listarTodasLasPaginas } from '../../core/listado-utils';
import { MovimientoResponse, ProductoResponse, ProveedorResponse, TipoMovimiento } from '../../core/models';
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
export class Movimientos {
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
  filtrosMovimiento = {
    busqueda: '',
    tipo: 'TODOS' as FiltroTodos<TipoMovimiento>,
    estado: 'TODOS' as FiltroTodos<'VIGENTE' | 'ANULADO'>,
  };

  readonly tiposMovimiento: TipoMovimiento[] = ['ENTRADA', 'SALIDA', 'AJUSTE'];
  readonly tiposMovimientoFiltro: Array<FiltroTodos<TipoMovimiento>> = ['TODOS', ...this.tiposMovimiento];
  readonly estadosMovimientoFiltro: Array<FiltroTodos<'VIGENTE' | 'ANULADO'>> = ['TODOS', 'VIGENTE', 'ANULADO'];
  readonly movimientoForm;
  paginaActual = 0;
  totalPaginas = 0;
  totalRegistros = 0;

  constructor(
    private fb: FormBuilder,
    private movimientosService: MovimientosService,
    private productosService: ProductosService,
    private proveedoresService: ProveedoresService,
    public auth: AuthService
  ) {
    this.movimientoForm = this.fb.nonNullable.group({
      tipo: ['ENTRADA' as TipoMovimiento, [Validators.required]],
      productoId: ['', [Validators.required]],
      proveedorId: [''],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      stockDestino: [0, [Validators.min(0)]],
      motivo: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(255)]],
    });
    this.movimientoForm.controls.tipo.valueChanges.subscribe((tipo) => {
      this.configurarTipoMovimiento(tipo);
    });
    this.configurarTipoMovimiento('ENTRADA');
    this.cargarDatos();
  }

  get productosActivos(): ProductoResponse[] {
    return this.productos.filter((producto) => producto.estado === 'ACTIVO');
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
      (!requiereProveedor || !!value.proveedorId) &&
      (!requiereStockDestino || value.stockDestino >= 0)
    );
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
    }).subscribe({
      next: ({ movimientos, productos, proveedores }) => {
        this.movimientos = movimientos.content;
        this.paginaActual = movimientos.page;
        this.totalPaginas = movimientos.totalPages;
        this.totalRegistros = movimientos.totalElements;
        this.productos = productos;
        this.proveedores = proveedores;
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
    this.mensaje = '';
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

  irAPagina(page: number): void {
    if (page < 0 || (this.totalPaginas > 0 && page >= this.totalPaginas)) return;
    this.paginaActual = page;
    this.cargarDatos();
  }

  registrarMovimiento(): void {
    if (this.enviando) return;
    if (!this.puedeGuardar) {
      this.movimientoForm.markAllAsTouched();
      this.mensaje = 'Completa correctamente los campos obligatorios.';
      return;
    }

    const value = this.movimientoForm.getRawValue();
    const usuarioId = this.usuarioSesionId();
    if (!usuarioId) {
      this.mensaje = 'Inicia sesión para registrar movimientos.';
      return;
    }

    this.enviando = true;
    this.movimientosService
      .registrar({
        productoId: value.productoId,
        proveedorId: value.tipo === 'ENTRADA' ? value.proveedorId : null,
        usuarioId,
        tipo: value.tipo,
        cantidad: value.cantidad,
        stockDestino: value.tipo === 'AJUSTE' ? value.stockDestino : null,
        motivo: value.motivo.trim().replace(/\s{2,}/g, ' '),
      })
      .subscribe({
        next: () => {
          this.enviando = false;
          this.mensaje = 'Movimiento registrado correctamente.';
          this.cerrarModal();
          this.cargarDatos();
        },
        error: (error: unknown) => {
          this.enviando = false;
          this.mensaje = getApiErrorMessage(error);
        },
      });
  }

  anularMovimiento(movimiento: MovimientoResponse): void {
    const motivo = window.prompt('Motivo de anulación');
    if (!motivo?.trim()) return;
    const usuarioId = this.usuarioSesionId();
    if (!usuarioId) {
      this.mensaje = 'Inicia sesión para anular movimientos.';
      return;
    }

    this.movimientosService
      .anular(movimiento.id, {
        usuarioId,
        motivoAnulacion: motivo.trim().replace(/\s{2,}/g, ' '),
      })
      .subscribe({
        next: () => {
          this.mensaje = 'Movimiento anulado correctamente.';
          this.cargarDatos();
        },
        error: (error: unknown) => {
          this.mensaje = getApiErrorMessage(error);
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
      stockDestino: 0,
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

  private configurarTipoMovimiento(tipo: TipoMovimiento): void {
    if (tipo === 'ENTRADA') {
      this.movimientoForm.controls.proveedorId.enable({ emitEvent: false });
    } else {
      this.movimientoForm.controls.proveedorId.setValue('', { emitEvent: false });
      this.movimientoForm.controls.proveedorId.disable({ emitEvent: false });
    }

    if (tipo === 'AJUSTE') {
      this.movimientoForm.controls.stockDestino.enable({ emitEvent: false });
    } else {
      this.movimientoForm.controls.stockDestino.setValue(0, { emitEvent: false });
      this.movimientoForm.controls.stockDestino.disable({ emitEvent: false });
    }
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
}
