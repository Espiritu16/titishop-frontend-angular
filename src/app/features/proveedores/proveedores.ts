import { DatePipe } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { getApiErrorMessage } from '../../core/api-error';
import { hayCambios, normalizarSnapshot } from '../../core/cambios-formulario';
import { ConfirmacionService } from '../../core/confirmacion.service';
import { descargarBlob, nombreArchivoExportacion } from '../../core/descarga-archivo';
import { EstadoCarga } from '../../core/estado-carga';
import { mensajeErrorCampo } from '../../core/form-error';
import { AccionDebounced, crearAccionDebounced, FiltroTodos } from '../../core/listado-utils';
import { EstadoProveedor, ProveedorResponse } from '../../core/models';
import { NotificacionService } from '../../core/notificacion.service';
import { ProveedoresService } from './proveedores.service';

@Component({
  host: { class: 'flex-1 flex flex-col overflow-hidden min-h-0' },
  selector: 'app-proveedores',
  imports: [ReactiveFormsModule, FormsModule, DatePipe],
  templateUrl: './proveedores.html',
  styleUrl: './proveedores.scss',
})
export class Proveedores implements OnDestroy {
  readonly pageSize = 10;
  mensaje = '';
  errorListado = '';
  errorRuc = '';
  editandoId: string | null = null;
  proveedores: ProveedorResponse[] = [];
  estadoListado: EstadoCarga = 'inicial';
  enviando = false;
  consultandoRuc = false;
  mostrarModal = false;
  proveedorFormEnviado = false;
  proveedorSnapshotOriginal: Record<string, string | number | boolean | null> | null = null;
  filtrosProveedor = {
    busqueda: '',
    estado: 'TODOS' as FiltroTodos<EstadoProveedor>,
  };

  readonly proveedorForm;
  readonly estadosProveedor: Array<FiltroTodos<EstadoProveedor>> = ['TODOS', 'ACTIVO', 'INACTIVO'];
  paginaActual = 0;
  totalPaginas = 0;
  totalRegistros = 0;
  private readonly busquedaDebounced: AccionDebounced = crearAccionDebounced(() => this.irAPagina(0));

  constructor(
    private fb: FormBuilder,
    private proveedoresService: ProveedoresService,
    private confirmacion: ConfirmacionService,
    private notificacion: NotificacionService
  ) {
    this.proveedorForm = this.fb.nonNullable.group({
      razonSocial: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
      ruc: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      celular: ['', [Validators.pattern(/^\d{9}$/)]],
      telefono: ['', [Validators.pattern(/^\d{9}$/)]],
      email: ['', [Validators.email, Validators.maxLength(160)]],
      direccion: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(160)]],
    }, { validators: Proveedores.contactoRequerido });
    this.cargarProveedores();
  }

  cargarProveedores(): void {
    this.estadoListado = 'cargando';
    this.errorListado = '';
    this.proveedoresService.listar({
      page: this.paginaActual,
      size: this.pageSize,
      busqueda: this.filtrosProveedor.busqueda,
      estado: this.filtrosProveedor.estado,
    }).subscribe({
      next: (pagina) => {
        this.proveedores = pagina.content;
        this.paginaActual = pagina.page;
        this.totalPaginas = pagina.totalPages;
        this.totalRegistros = pagina.totalElements;
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
    this.cargarProveedores();
  }

  exportarProveedoresExcel(): void {
    this.exportarProveedores('excel');
  }

  exportarProveedoresPdf(): void {
    this.exportarProveedores('pdf');
  }

  guardarProveedor(): void {
    if (this.enviando) return;
    this.proveedorFormEnviado = true;

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
    const estadoActual = this.proveedores.find((proveedor) => proveedor.id === this.editandoId)?.estado ?? 'ACTIVO';

    if (this.editandoId) {
      const actual = normalizarSnapshot({ ...request, estado: estadoActual }, ['email']);
      if (this.proveedorSnapshotOriginal && !hayCambios(this.proveedorSnapshotOriginal, actual)) {
        this.mostrarToast('No hay cambios para actualizar.', 'success');
        return;
      }
    }

    this.enviando = true;
    const request$ = this.editandoId
      ? this.proveedoresService.actualizar(this.editandoId, {
          ...request,
          estado: estadoActual,
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
    this.proveedorFormEnviado = false;
    this.mostrarModal = true;
    this.proveedorForm.setValue({
      razonSocial: proveedor.razonSocial,
      ruc: proveedor.ruc,
      celular: proveedor.celular ?? '',
      telefono: proveedor.telefono ?? '',
      email: proveedor.email ?? '',
      direccion: proveedor.direccion,
    });
    this.proveedorSnapshotOriginal = normalizarSnapshot({
      razonSocial: proveedor.razonSocial,
      ruc: proveedor.ruc,
      celular: proveedor.celular ?? null,
      telefono: proveedor.telefono ?? null,
      email: proveedor.email ?? null,
      direccion: proveedor.direccion,
      estado: proveedor.estado,
    }, ['email']);
    this.mostrarToast(`Editando proveedor ${proveedor.razonSocial}.`, 'success');
  }

  cancelarEdicion(): void {
    this.mostrarModal = false;
    this.mensaje = '';
    this.errorRuc = '';
    this.editandoId = null;
    this.proveedorFormEnviado = false;
    this.proveedorSnapshotOriginal = null;
    this.proveedorForm.reset({
      razonSocial: '',
      ruc: '',
      celular: '',
      telefono: '',
      email: '',
      direccion: '',
    });
  }

  async cambiarEstadoProveedor(proveedor: ProveedorResponse): Promise<void> {
    const accion = proveedor.estado === 'ACTIVO' ? 'desactivar' : 'activar';
    const confirmado = await this.confirmacion.confirmar({
      titulo: `${accion === 'desactivar' ? 'Desactivar' : 'Activar'} proveedor`,
      mensaje: `Se va a ${accion} el proveedor ${proveedor.razonSocial}.`,
      textoConfirmar: accion === 'desactivar' ? 'Desactivar' : 'Activar',
      tono: accion === 'desactivar' ? 'danger' : 'normal',
    });
    if (!confirmado) return;

    this.proveedoresService
      .actualizarEstado(proveedor.id, proveedor.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO')
      .subscribe({
        next: () => {
          this.mostrarToast(
            proveedor.estado === 'ACTIVO'
              ? 'Proveedor desactivado correctamente.'
              : 'Proveedor activado correctamente.',
            'success'
          );
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

  fieldError(controlName: keyof typeof this.proveedorForm.controls): string {
    const mensajes = {
      razonSocial: {
        required: 'Consulta o ingresa la razón social.',
        minlength: 'La razón social debe tener al menos 3 caracteres.',
        maxlength: 'La razón social no debe superar 120 caracteres.',
      },
      ruc: {
        required: 'Ingresa el RUC.',
        pattern: 'El RUC debe tener 11 dígitos.',
      },
      celular: { pattern: 'El celular debe tener 9 dígitos.' },
      telefono: { pattern: 'El teléfono debe tener 9 dígitos.' },
      email: {
        email: 'Ingresa un correo válido.',
        maxlength: 'El correo no debe superar 160 caracteres.',
      },
      direccion: {
        required: 'Consulta o ingresa la dirección.',
        minlength: 'La dirección debe tener al menos 5 caracteres.',
        maxlength: 'La dirección no debe superar 160 caracteres.',
      },
    } satisfies Partial<Record<keyof typeof this.proveedorForm.controls, Record<string, string>>>;

    return mensajeErrorCampo(this.proveedorForm.controls[controlName], mensajes[controlName], this.proveedorFormEnviado);
  }

  contactoError(): string {
    if (!this.proveedorForm.errors?.['contactoRequerido']) return '';
    if (!this.proveedorFormEnviado && !this.proveedorForm.dirty && !this.proveedorForm.touched) return '';
    return 'Ingresa al menos un celular, teléfono o correo.';
  }

  private static contactoRequerido(control: AbstractControl): ValidationErrors | null {
    const celular = `${control.get('celular')?.value ?? ''}`.trim();
    const telefono = `${control.get('telefono')?.value ?? ''}`.trim();
    const email = `${control.get('email')?.value ?? ''}`.trim();
    return celular || telefono || email ? null : { contactoRequerido: true };
  }

  private mostrarToast(message: string, type: 'success' | 'error'): void {
    if (type === 'success') {
      this.notificacion.success(message);
      return;
    }
    this.notificacion.error(message);
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

  private exportarProveedores(tipo: 'excel' | 'pdf'): void {
    this.proveedoresService.exportar(tipo, this.filtrosProveedor).subscribe({
      next: (blob) => {
        descargarBlob(blob, nombreArchivoExportacion('proveedores', tipo));
        this.notificacion.success(`Proveedores exportados a ${tipo === 'excel' ? 'Excel' : 'PDF'}.`);
      },
      error: (error: unknown) => this.notificacion.error(getApiErrorMessage(error)),
    });
  }
}
