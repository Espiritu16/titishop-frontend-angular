import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { getApiErrorMessage } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { EstadoCarga } from '../../core/estado-carga';
import { MovimientoResponse, ProductoResponse, ProveedorResponse, TipoMovimiento } from '../../core/models';
import { ProductosService } from '../productos/productos.service';
import { ProveedoresService } from '../proveedores/proveedores.service';
import { MovimientosService } from './movimientos.service';

@Component({
  host: { class: 'flex-1 flex flex-col overflow-hidden min-h-0' },
  selector: 'app-movimientos',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './movimientos.html',
  styleUrl: './movimientos.scss',
})
export class Movimientos {
  mensaje = '';
  errorListado = '';
  estadoListado: EstadoCarga = 'inicial';
  enviando = false;
  mostrarModal = false;

  movimientos: MovimientoResponse[] = [];
  productos: ProductoResponse[] = [];
  proveedores: ProveedorResponse[] = [];

  readonly tiposMovimiento: TipoMovimiento[] = ['ENTRADA', 'SALIDA', 'AJUSTE'];
  readonly movimientoForm;

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
      movimientos: this.movimientosService.listar(),
      productos: this.productosService.listar(),
      proveedores: this.proveedoresService.listar(),
    }).subscribe({
      next: ({ movimientos, productos, proveedores }) => {
        this.movimientos = movimientos;
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
  }

  bloquearTeclasNumeroInvalido(event: KeyboardEvent): void {
    if (['e', 'E', '+', '-'].includes(event.key)) event.preventDefault();
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
  }

  movimientoClase(type: TipoMovimiento): string {
    if (type === 'ENTRADA') return 'bg-green-100 text-green-700';
    if (type === 'SALIDA') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-600';
  }

  estaAnulado(movimiento: MovimientoResponse): boolean {
    return !!movimiento.anuladoEn;
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
}
