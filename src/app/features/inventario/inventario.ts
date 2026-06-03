import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { getApiErrorMessage } from '../../core/api-error';
import { EstadoCarga } from '../../core/estado-carga';
import { EstadoInventario, InventarioResponse, ProductoResponse } from '../../core/models';
import { ProductosService } from '../productos/productos.service';
import { InventarioService } from './inventario.service';

type EstadoStock = 'NORMAL' | 'BAJO' | 'AGOTADO';

@Component({
  host: { class: 'flex-1 flex flex-col overflow-hidden min-h-0' },
  selector: 'app-inventario',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './inventario.html',
  styleUrl: './inventario.scss',
})
export class Inventario {
  mensaje = '';
  errorListado = '';
  estadoListado: EstadoCarga = 'inicial';
  editandoId: string | null = null;
  inventarios: InventarioResponse[] = [];
  productos: ProductoResponse[] = [];
  mostrarModal = false;
  enviando = false;

  readonly inventarioForm;

  constructor(
    private fb: FormBuilder,
    private inventarioService: InventarioService,
    private productosService: ProductosService
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

  cargarDatos(): void {
    this.estadoListado = 'cargando';
    this.errorListado = '';
    forkJoin({
      inventarios: this.inventarioService.listar(),
      productos: this.productosService.listar(),
    }).subscribe({
      next: ({ inventarios, productos }) => {
        this.inventarios = inventarios;
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

  guardarInventario(): void {
    if (this.enviando) return;
    if (this.inventarioForm.invalid) {
      this.inventarioForm.markAllAsTouched();
      this.mensaje = 'Completa correctamente los campos obligatorios.';
      return;
    }

    const value = this.inventarioForm.getRawValue();
    this.enviando = true;
    const request$ = this.editandoId
      ? this.inventarioService.actualizar(this.editandoId, {
          stockMinimo: value.stockMinimo,
          ubicacion: this.normalizarTexto(value.ubicacion),
          estado: this.inventarios.find((item) => item.id === this.editandoId)?.estado ?? 'ACTIVO',
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
        this.mensaje = this.editandoId
          ? 'Inventario actualizado correctamente.'
          : 'Inventario creado correctamente.';
        this.cancelarEdicion();
        this.cargarDatos();
      },
      error: (error: unknown) => {
        this.enviando = false;
        this.mensaje = getApiErrorMessage(error);
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
    this.mensaje = `Editando inventario de ${item.productoNombre}.`;
  }

  cancelarEdicion(): void {
    this.mostrarModal = false;
    this.editandoId = null;
    this.inventarioForm.controls.productoId.enable({ emitEvent: false });
    this.inventarioForm.controls.stockActual.enable({ emitEvent: false });
    this.inventarioForm.reset({
      productoId: '',
      stockActual: 0,
      stockMinimo: 0,
      ubicacion: '',
    });
  }

  cambiarEstadoInventario(item: InventarioResponse): void {
    const request$: Observable<unknown> =
      item.estado === 'ACTIVO'
        ? this.inventarioService.inactivar(item.id)
        : this.inventarioService.actualizar(item.id, {
            stockMinimo: item.stockMinimo,
            ubicacion: item.ubicacion,
            estado: 'ACTIVO',
          });

    request$.subscribe({
      next: () => {
        this.mensaje =
          item.estado === 'ACTIVO'
            ? 'Inventario desactivado correctamente.'
            : 'Inventario activado correctamente.';
        this.cargarDatos();
      },
      error: (error: unknown) => {
        this.mensaje = getApiErrorMessage(error);
      },
    });
  }

  estadoStock(item: InventarioResponse): EstadoStock {
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

  private productoEditandoId(): string | null {
    if (!this.editandoId) return null;
    return this.inventarios.find((item) => item.id === this.editandoId)?.productoId ?? null;
  }

  private normalizarTexto(value: string): string {
    return value.trim().replace(/\s{2,}/g, ' ');
  }
}
