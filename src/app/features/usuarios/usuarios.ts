import { DatePipe } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { getApiErrorMessage } from '../../core/api-error';
import { hayCambios, normalizarSnapshot } from '../../core/cambios-formulario';
import { ConfirmacionService } from '../../core/confirmacion.service';
import { descargarBlob, nombreArchivoExportacion } from '../../core/descarga-archivo';
import { EstadoCarga } from '../../core/estado-carga';
import { AccionDebounced, crearAccionDebounced, FiltroTodos } from '../../core/listado-utils';
import { EstadoCatalogo, RolUsuario, UsuarioResponse } from '../../core/models';
import { NotificacionService } from '../../core/notificacion.service';
import { UsuariosService } from './usuarios.service';

@Component({
  host: { class: 'flex-1 flex flex-col overflow-hidden min-h-0' },
  selector: 'app-usuarios',
  imports: [ReactiveFormsModule, FormsModule, DatePipe],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class Usuarios implements OnDestroy {
  readonly pageSize = 10;
  mensaje = '';
  errorListado = '';
  estadoListado: EstadoCarga = 'inicial';
  usuarioEditandoId: string | null = null;
  mostrarModal = false;
  enviando = false;
  usuarioSnapshotOriginal: Record<string, string | number | boolean | null> | null = null;

  readonly roles: RolUsuario[] = ['ADMINISTRADOR', 'ALMACENERO', 'SUPERVISOR'];
  readonly rolesFiltro: Array<FiltroTodos<RolUsuario>> = ['TODOS', ...this.roles];
  readonly estadosUsuario: Array<FiltroTodos<EstadoCatalogo>> = ['TODOS', 'ACTIVO', 'INACTIVO'];
  usuarios: UsuarioResponse[] = [];
  filtrosUsuario = {
    busqueda: '',
    rol: 'TODOS' as FiltroTodos<RolUsuario>,
    estado: 'TODOS' as FiltroTodos<EstadoCatalogo>,
  };
  readonly usuarioForm;
  private readonly namePattern = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;
  paginaActual = 0;
  totalPaginas = 0;
  totalRegistros = 0;
  private readonly busquedaDebounced: AccionDebounced = crearAccionDebounced(() => this.irAPagina(0));

  constructor(
    private fb: FormBuilder,
    private usuariosService: UsuariosService,
    private confirmacion: ConfirmacionService,
    private notificacion: NotificacionService
  ) {
    this.usuarioForm = this.fb.nonNullable.group({
      nombreCompleto: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120), Validators.pattern(this.namePattern)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
      rol: ['ALMACENERO' as RolUsuario, [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(120)]],
    });
    this.cargarUsuarios();
  }

  get puedeGuardar(): boolean {
    return this.usuarioForm.valid && !this.enviando;
  }

  get hayFiltrosActivos(): boolean {
    return Boolean(this.filtrosUsuario.busqueda.trim())
      || this.filtrosUsuario.rol !== 'TODOS'
      || this.filtrosUsuario.estado !== 'TODOS';
  }

  cargarUsuarios(): void {
    this.estadoListado = 'cargando';
    this.errorListado = '';
    this.usuariosService.listar({
      page: this.paginaActual,
      size: this.pageSize,
      busqueda: this.filtrosUsuario.busqueda,
      rol: this.filtrosUsuario.rol,
      estado: this.filtrosUsuario.estado,
    }).subscribe({
      next: (pagina) => {
        this.usuarios = pagina.content;
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

  limpiarFiltrosUsuarios(): void {
    this.filtrosUsuario = {
      busqueda: '',
      rol: 'TODOS',
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
    this.cargarUsuarios();
  }

  exportarUsuariosExcel(): void {
    this.exportarUsuarios('excel');
  }

  exportarUsuariosPdf(): void {
    this.exportarUsuarios('pdf');
  }

  guardarUsuario(): void {
    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      this.notificacion.error('Completa correctamente los campos requeridos.');
      return;
    }

    const value = this.usuarioForm.getRawValue();
    const base = {
      nombreCompleto: value.nombreCompleto.trim().replace(/\s+/g, ' '),
      email: value.email.trim().toLowerCase(),
      rol: value.rol,
    };
    const estadoActual = this.usuarios.find((usuario) => usuario.id === this.usuarioEditandoId)?.estado ?? 'ACTIVO';
    const password = value.password.trim();
    if (this.usuarioEditandoId && !password) {
      const actual = normalizarSnapshot({ ...base, estado: estadoActual }, ['email']);
      if (this.usuarioSnapshotOriginal && !hayCambios(this.usuarioSnapshotOriginal, actual)) {
        this.notificacion.info('No hay cambios para actualizar.');
        return;
      }
    }

    this.enviando = true;

    const request$ = this.usuarioEditandoId
      ? this.usuariosService.actualizar(this.usuarioEditandoId, {
          ...base,
          password: password || null,
          estado: estadoActual,
        })
      : this.usuariosService.crear({
          ...base,
          password: value.password.trim(),
        });

    request$.subscribe({
      next: () => {
        this.enviando = false;
        this.notificacion.success(this.usuarioEditandoId
          ? 'Usuario actualizado correctamente.'
          : 'Usuario registrado correctamente.');
        this.cancelarEdicion();
        this.cargarUsuarios();
      },
      error: (error: unknown) => {
        this.enviando = false;
        this.notificacion.error(getApiErrorMessage(error));
      },
    });
  }

  editarUsuario(usuario: UsuarioResponse): void {
    this.usuarioEditandoId = usuario.id;
    this.mostrarModal = true;
    this.usuarioForm.setValue({
      nombreCompleto: usuario.nombreCompleto,
      email: usuario.email,
      rol: usuario.rol,
      password: '',
    });
    this.usuarioForm.controls.password.clearValidators();
    this.usuarioForm.controls.password.setValidators([Validators.minLength(8), Validators.maxLength(120)]);
    this.usuarioForm.controls.password.updateValueAndValidity();
    this.usuarioSnapshotOriginal = normalizarSnapshot({
      nombreCompleto: usuario.nombreCompleto,
      email: usuario.email,
      rol: usuario.rol,
      estado: usuario.estado,
    }, ['email']);
    this.notificacion.info(`Editando a ${usuario.nombreCompleto}.`);
  }

  cancelarEdicion(): void {
    this.mostrarModal = false;
    this.usuarioEditandoId = null;
    this.usuarioSnapshotOriginal = null;
    this.usuarioForm.reset({
      nombreCompleto: '',
      email: '',
      rol: 'ALMACENERO',
      password: '',
    });
    this.usuarioForm.controls.password.setValidators([Validators.required, Validators.minLength(8), Validators.maxLength(120)]);
    this.usuarioForm.controls.password.updateValueAndValidity();
  }

  async cambiarEstadoUsuario(usuario: UsuarioResponse): Promise<void> {
    const accion = usuario.estado === 'ACTIVO' ? 'desactivar' : 'activar';
    const confirmado = await this.confirmacion.confirmar({
      titulo: `${accion === 'desactivar' ? 'Desactivar' : 'Activar'} usuario`,
      mensaje: `Se va a ${accion} el usuario ${usuario.nombreCompleto}.`,
      textoConfirmar: accion === 'desactivar' ? 'Desactivar' : 'Activar',
      tono: accion === 'desactivar' ? 'danger' : 'normal',
    });
    if (!confirmado) return;

    this.usuariosService
      .actualizarEstado(usuario.id, usuario.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO')
      .subscribe({
        next: () => {
          this.notificacion.success(
            usuario.estado === 'ACTIVO'
              ? 'Usuario desactivado correctamente.'
              : 'Usuario activado correctamente.'
          );
          this.cargarUsuarios();
        },
        error: (error: unknown) => {
          this.notificacion.error(getApiErrorMessage(error));
        },
      });
  }

  estadoClase(status: EstadoCatalogo): string {
    return status === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500';
  }

  onNombreInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = input.value
      .replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ ]/g, '')
      .replace(/\s{2,}/g, ' ');
    if (sanitized !== input.value) {
      input.value = sanitized;
      this.usuarioForm.controls.nombreCompleto.setValue(sanitized, { emitEvent: false });
    }
  }

  private exportarUsuarios(tipo: 'excel' | 'pdf'): void {
    this.usuariosService.exportar(tipo, this.filtrosUsuario).subscribe({
      next: (blob) => {
        descargarBlob(blob, nombreArchivoExportacion('usuarios', tipo));
        this.notificacion.success(`Usuarios exportados a ${tipo === 'excel' ? 'Excel' : 'PDF'}.`);
      },
      error: (error: unknown) => this.notificacion.error(getApiErrorMessage(error)),
    });
  }
}
