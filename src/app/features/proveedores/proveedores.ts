import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { getApiErrorMessage } from '../../core/api-error';
import { EstadoCarga } from '../../core/estado-carga';
import { FiltroTodos, buscarEnCampos, coincideFiltro, ordenarPorCreacionDesc } from '../../core/listado-utils';
import { EstadoProveedor, ProveedorResponse } from '../../core/models';
import { ProveedoresService } from './proveedores.service';

type ToastType = 'success' | 'error';

@Component({
  host: { class: 'flex-1 flex flex-col overflow-hidden min-h-0' },
  selector: 'app-proveedores',
  imports: [ReactiveFormsModule, FormsModule, DatePipe],
  templateUrl: './proveedores.html',
  styleUrl: './proveedores.scss',
})
export class Proveedores {
  mensaje = '';
  errorListado = '';
  errorRuc = '';
  toastMessage = '';
  toastType: ToastType = 'success';
  editandoId: string | null = null;
  proveedores: ProveedorResponse[] = [];
  estadoListado: EstadoCarga = 'inicial';
  enviando = false;
  consultandoRuc = false;
  mostrarModal = false;
  filtrosProveedor = {
    busqueda: '',
    estado: 'TODOS' as FiltroTodos<EstadoProveedor>,
  };
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  readonly proveedorForm;
  readonly estadosProveedor: Array<FiltroTodos<EstadoProveedor>> = ['TODOS', 'ACTIVO', 'INACTIVO'];

  constructor(
    private fb: FormBuilder,
    private proveedoresService: ProveedoresService
  ) {
    this.proveedorForm = this.fb.nonNullable.group({
      razonSocial: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
      ruc: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      celular: ['', [Validators.pattern(/^\d{9}$/)]],
      telefono: ['', [Validators.pattern(/^\d{9}$/)]],
      email: ['', [Validators.email, Validators.maxLength(160)]],
      direccion: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(160)]],
    });
    this.cargarProveedores();
  }

  get proveedoresFiltrados(): ProveedorResponse[] {
    return ordenarPorCreacionDesc(this.proveedores).filter(
      (proveedor) =>
        buscarEnCampos(proveedor, this.filtrosProveedor.busqueda, [
          'razonSocial',
          'ruc',
          'celular',
          'telefono',
          'email',
          'direccion',
        ]) && coincideFiltro(proveedor.estado, this.filtrosProveedor.estado)
    );
  }

  cargarProveedores(): void {
    this.estadoListado = 'cargando';
    this.errorListado = '';
    this.proveedoresService.listar().subscribe({
      next: (proveedores) => {
        this.proveedores = proveedores;
        this.estadoListado = 'exito';
      },
      error: (error: unknown) => {
        this.estadoListado = 'error';
        this.errorListado = getApiErrorMessage(error);
      },
    });
  }

  consultarRuc(): void {
    const ruc = this.proveedorForm.controls.ruc.value.replace(/\D/g, '').trim();
    this.mensaje = '';
    this.errorRuc = '';

    if (!/^\d{11}$/.test(ruc)) {
      this.proveedorForm.controls.ruc.markAsTouched();
      this.errorRuc = 'Ingrese un RUC válido de 11 dígitos.';
      this.mostrarToast('Ingrese un RUC válido antes de consultar.', 'error');
      return;
    }

    this.consultandoRuc = true;
    this.proveedoresService.consultarRuc(ruc).subscribe({
      next: (response) => {
        const razonSocial = response.razonSocial ?? '';
        const direccion = response.direccionCompleta || response.direccion || '';
        this.proveedorForm.patchValue({
          ruc: response.ruc,
          razonSocial,
          direccion,
        });
        this.proveedorForm.controls.razonSocial.markAsTouched();
        this.proveedorForm.controls.direccion.markAsTouched();

        if (!razonSocial || !direccion) {
          this.errorRuc = 'La consulta no devolvió razón social o dirección.';
          this.mostrarToast('La consulta no devolvió todos los datos necesarios.', 'error');
          return;
        }

        this.mostrarToast('RUC consultado. Razón social y dirección completadas.', 'success');
      },
      error: (error: unknown) => {
        const message = getApiErrorMessage(error);
        this.errorRuc = message;
        this.proveedorForm.controls.ruc.markAsTouched();
        this.mostrarToast(message, 'error');
        this.consultandoRuc = false;
      },
      complete: () => {
        this.consultandoRuc = false;
      },
    });
  }

  limpiarFiltrosProveedores(): void {
    this.filtrosProveedor = {
      busqueda: '',
      estado: 'TODOS',
    };
  }

  guardarProveedor(): void {
    if (this.enviando) return;

    if (this.proveedorForm.invalid) {
      this.proveedorForm.markAllAsTouched();
      this.mostrarToast('Revisa los campos marcados antes de guardar.', 'error');
      return;
    }

    const value = this.proveedorForm.getRawValue();
    const request = {
      razonSocial: this.normalizarTexto(value.razonSocial),
      ruc: value.ruc.replace(/\D/g, ''),
      celular: this.normalizarDigitosOpcional(value.celular),
      telefono: this.normalizarDigitosOpcional(value.telefono),
      email: this.normalizarEmailOpcional(value.email),
      direccion: this.normalizarTexto(value.direccion),
    };

    this.enviando = true;
    const request$ = this.editandoId
      ? this.proveedoresService.actualizar(this.editandoId, {
          ...request,
          estado: this.proveedores.find((proveedor) => proveedor.id === this.editandoId)?.estado ?? 'ACTIVO',
        })
      : this.proveedoresService.crear(request);

    request$.subscribe({
      next: () => {
        this.enviando = false;
        this.mostrarToast(
          this.editandoId ? 'Proveedor actualizado correctamente.' : 'Proveedor registrado correctamente.',
          'success'
        );
        this.cancelarEdicion();
        this.cargarProveedores();
      },
      error: (error: unknown) => {
        this.enviando = false;
        this.mostrarToast(getApiErrorMessage(error), 'error');
      },
    });
  }

  editarProveedor(proveedor: ProveedorResponse): void {
    this.editandoId = proveedor.id;
    this.mostrarModal = true;
    this.proveedorForm.setValue({
      razonSocial: proveedor.razonSocial,
      ruc: proveedor.ruc,
      celular: proveedor.celular ?? '',
      telefono: proveedor.telefono ?? '',
      email: proveedor.email ?? '',
      direccion: proveedor.direccion,
    });
    this.mostrarToast(`Editando proveedor ${proveedor.razonSocial}.`, 'success');
  }

  cancelarEdicion(): void {
    this.mostrarModal = false;
    this.mensaje = '';
    this.errorRuc = '';
    this.editandoId = null;
    this.proveedorForm.reset({
      razonSocial: '',
      ruc: '',
      celular: '',
      telefono: '',
      email: '',
      direccion: '',
    });
  }

  cambiarEstadoProveedor(proveedor: ProveedorResponse): void {
    if (proveedor.estado === 'ACTIVO') {
      this.proveedoresService.inactivar(proveedor.id).subscribe({
        next: () => {
          this.mostrarToast('Proveedor desactivado correctamente.', 'success');
          this.cargarProveedores();
        },
        error: (error: unknown) => {
          this.mostrarToast(getApiErrorMessage(error), 'error');
        },
      });
      return;
    }

    this.proveedoresService
      .actualizar(proveedor.id, {
        razonSocial: proveedor.razonSocial,
        ruc: proveedor.ruc,
        celular: proveedor.celular ?? null,
        telefono: proveedor.telefono ?? null,
        email: proveedor.email ?? null,
        direccion: proveedor.direccion,
        estado: 'ACTIVO',
      })
      .subscribe({
        next: () => {
          this.mostrarToast('Proveedor activado correctamente.', 'success');
          this.cargarProveedores();
        },
        error: (error: unknown) => {
          this.mostrarToast(getApiErrorMessage(error), 'error');
        },
      });
  }

  onRucInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 11);
    this.proveedorForm.controls.ruc.setValue(digits, { emitEvent: false });
    this.errorRuc = '';
  }

  onTelefonoInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 9);
    this.proveedorForm.controls.telefono.setValue(digits, { emitEvent: false });
  }

  onCelularInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 9);
    this.proveedorForm.controls.celular.setValue(digits, { emitEvent: false });
  }

  onEmailInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cleaned = input.value.replace(/\s+/g, '').toLowerCase();
    this.proveedorForm.controls.email.setValue(cleaned, { emitEvent: false });
  }

  puedeGuardar(): boolean {
    return this.proveedorForm.valid && !this.enviando && !this.consultandoRuc;
  }

  estadoClase(status: EstadoProveedor): string {
    return status === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500';
  }

  toastClass(): string {
    return this.toastType === 'success'
      ? 'border-green-200 bg-green-50 text-green-800'
      : 'border-red-200 bg-red-50 text-red-800';
  }

  fieldError(controlName: keyof typeof this.proveedorForm.controls): string {
    const control = this.proveedorForm.controls[controlName];
    if (!control.touched || !control.errors) return '';

    if (control.errors['required']) return 'Este campo es obligatorio.';
    if (control.errors['pattern']) {
      if (controlName === 'ruc') return 'El RUC debe tener 11 dígitos.';
      if (controlName === 'celular') return 'El celular debe tener 9 dígitos.';
      if (controlName === 'telefono') return 'El teléfono debe tener 9 dígitos.';
    }
    if (control.errors['email']) return 'Ingrese un correo válido.';
    if (control.errors['minlength']) return 'El valor ingresado es demasiado corto.';
    if (control.errors['maxlength']) return 'El valor ingresado es demasiado largo.';

    return 'Revise este campo.';
  }

  private mostrarToast(message: string, type: ToastType): void {
    this.toastMessage = message;
    this.toastType = type;

    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage = '';
      this.toastTimer = null;
    }, 3500);
  }

  private normalizarTexto(value: string): string {
    return value.trim().replace(/\s{2,}/g, ' ');
  }

  private normalizarDigitosOpcional(value: string): string | null {
    const digits = value.replace(/\D/g, '');
    return digits ? digits : null;
  }

  private normalizarEmailOpcional(value: string): string | null {
    const email = value.trim().toLowerCase().replace(/\s+/g, '');
    return email ? email : null;
  }
}
