import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { getApiErrorMessage } from '../../core/api-error';
import { EstadoCarga } from '../../core/estado-carga';
import { EstadoCatalogo, RolUsuario, UsuarioResponse } from '../../core/models';
import { UsuariosService } from './usuarios.service';

@Component({
  host: { class: 'flex-1 flex flex-col overflow-hidden min-h-0' },
  selector: 'app-usuarios',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class Usuarios {
  mensaje = '';
  errorListado = '';
  estadoListado: EstadoCarga = 'inicial';
  usuarioEditandoId: string | null = null;
  mostrarModal = false;
  enviando = false;

  readonly roles: RolUsuario[] = ['ADMINISTRADOR', 'ALMACENERO', 'SUPERVISOR'];
  usuarios: UsuarioResponse[] = [];
  readonly usuarioForm;
  private readonly namePattern = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;

  constructor(
    private fb: FormBuilder,
    private usuariosService: UsuariosService
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

  cargarUsuarios(): void {
    this.estadoListado = 'cargando';
    this.errorListado = '';
    this.usuariosService.listar().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.estadoListado = 'exito';
      },
      error: (error: unknown) => {
        this.estadoListado = 'error';
        this.errorListado = getApiErrorMessage(error);
      },
    });
  }

  guardarUsuario(): void {
    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      this.mensaje = 'Completa correctamente los campos requeridos.';
      return;
    }

    const value = this.usuarioForm.getRawValue();
    const base = {
      nombreCompleto: value.nombreCompleto.trim().replace(/\s+/g, ' '),
      email: value.email.trim().toLowerCase(),
      rol: value.rol,
    };
    this.enviando = true;

    const request$ = this.usuarioEditandoId
      ? this.usuariosService.actualizar(this.usuarioEditandoId, {
          ...base,
          password: value.password.trim() || null,
          estado: this.usuarios.find((usuario) => usuario.id === this.usuarioEditandoId)?.estado ?? 'ACTIVO',
        })
      : this.usuariosService.crear({
          ...base,
          password: value.password.trim(),
        });

    request$.subscribe({
      next: () => {
        this.enviando = false;
        this.mensaje = this.usuarioEditandoId
          ? 'Usuario actualizado correctamente.'
          : 'Usuario registrado correctamente.';
        this.cancelarEdicion();
        this.cargarUsuarios();
      },
      error: (error: unknown) => {
        this.enviando = false;
        this.mensaje = getApiErrorMessage(error);
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
    this.mensaje = `Editando a ${usuario.nombreCompleto}.`;
  }

  cancelarEdicion(): void {
    this.mostrarModal = false;
    this.usuarioEditandoId = null;
    this.usuarioForm.reset({
      nombreCompleto: '',
      email: '',
      rol: 'ALMACENERO',
      password: '',
    });
    this.usuarioForm.controls.password.setValidators([Validators.required, Validators.minLength(8), Validators.maxLength(120)]);
    this.usuarioForm.controls.password.updateValueAndValidity();
  }

  cambiarEstadoUsuario(usuario: UsuarioResponse): void {
    if (usuario.estado === 'ACTIVO') {
      this.usuariosService.inactivar(usuario.id).subscribe({
        next: () => {
          this.mensaje = 'Usuario desactivado correctamente.';
          this.cargarUsuarios();
        },
        error: (error: unknown) => {
          this.mensaje = getApiErrorMessage(error);
        },
      });
      return;
    }

    this.usuariosService
      .actualizar(usuario.id, {
        nombreCompleto: usuario.nombreCompleto,
        email: usuario.email,
        password: null,
        rol: usuario.rol,
        estado: 'ACTIVO',
      })
      .subscribe({
        next: () => {
          this.mensaje = 'Usuario activado correctamente.';
          this.cargarUsuarios();
        },
        error: (error: unknown) => {
          this.mensaje = getApiErrorMessage(error);
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
}
