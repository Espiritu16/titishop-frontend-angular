import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';

type UserRole = 'ADMINISTRADOR' | 'ALMACENERO' | 'SUPERVISOR';
type UserStatus = 'ACTIVO' | 'INACTIVO';

interface UserItem {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  password: string;
  createdAt: string;
}

const USERS_KEY = 'titishop_usuarios';
const DEFAULT_PASSWORD = '123456';

@Component({
  selector: 'app-users',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users {
  feedback = '';
  editingUserId: string | null = null;

  readonly roles: UserRole[] = ['ADMINISTRADOR', 'ALMACENERO', 'SUPERVISOR'];
  users: UserItem[] = [];
  readonly userForm;
  private readonly namePattern = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;

  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.nonNullable.group({
      fullName: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['ALMACENERO' as UserRole, [Validators.required]],
    });
    this.loadUsers();
  }

  get canSubmit(): boolean {
    return this.userForm.valid;
  }

  saveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      this.feedback = 'Completa correctamente los campos requeridos.';
      return;
    }

    const formValue = this.userForm.getRawValue();
    const normalizedName = formValue.fullName.trim().replace(/\s+/g, ' ');
    const normalizedEmail = formValue.email.trim().toLowerCase();

    if (!this.namePattern.test(normalizedName)) {
      this.feedback = 'El nombre solo puede contener letras y espacios.';
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailPattern.test(normalizedEmail)) {
      this.feedback = 'Ingrese un correo electrónico válido.';
      return;
    }

    const duplicated = this.users.find(
      (user) => user.email.toLowerCase() === normalizedEmail && user.id !== this.editingUserId
    );

    if (duplicated) {
      this.feedback = 'Ya existe un usuario con ese correo.';
      return;
    }

    if (this.editingUserId) {
      this.users = this.users.map((user) =>
        user.id === this.editingUserId
          ? {
              ...user,
              fullName: normalizedName,
              email: normalizedEmail,
              role: formValue.role,
            }
          : user
      );
      this.feedback = 'Usuario actualizado correctamente.';
    } else {
      const newUser: UserItem = {
        id: crypto.randomUUID(),
        fullName: normalizedName,
        email: normalizedEmail,
        role: formValue.role,
        status: 'ACTIVO',
        password: DEFAULT_PASSWORD,
        createdAt: new Date().toISOString(),
      };
      this.users = [newUser, ...this.users];
      this.feedback = 'Usuario registrado correctamente.';
    }

    this.persistUsers();
    this.cancelEdit();
  }

  editUser(user: UserItem): void {
    this.editingUserId = user.id;
    this.userForm.setValue({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    });
    this.feedback = `Editando a ${user.fullName}.`;
  }

  cancelEdit(): void {
    this.editingUserId = null;
    this.userForm.reset({
      fullName: '',
      email: '',
      role: 'ALMACENERO',
    });
  }

  toggleStatus(userId: string): void {
    this.users = this.users.map((user) =>
      user.id === userId
        ? { ...user, status: user.status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO' }
        : user
    );
    this.persistUsers();
    if (this.editingUserId) {
      this.feedback = 'Estado de usuario actualizado.';
    }
  }

  statusBadgeClass(status: UserStatus): string {
    return status === 'ACTIVO' ? 'badge text-bg-success' : 'badge text-bg-secondary';
  }

  onNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = input.value
      .replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ ]/g, '')
      .replace(/\s{2,}/g, ' ');
    if (sanitized !== input.value) {
      input.value = sanitized;
      this.userForm.controls.fullName.setValue(sanitized, { emitEvent: false });
    }
  }

  private loadUsers(): void {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      this.users = this.seedUsers();
      this.persistUsers();
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Array<Partial<UserItem> & { active?: boolean }>;
      if (!Array.isArray(parsed)) {
        this.users = this.seedUsers();
        return;
      }

      this.users = parsed.map((user) => {
        const active = typeof user.active === 'boolean' ? user.active : user.status === 'ACTIVO';
        return {
          id: user.id ?? crypto.randomUUID(),
          fullName: user.fullName ?? 'Usuario sin nombre',
          email: (user.email ?? '').toLowerCase(),
          role: (user.role as UserRole) ?? 'ALMACENERO',
          status: active ? 'ACTIVO' : 'INACTIVO',
          password: user.password ?? DEFAULT_PASSWORD,
          createdAt: user.createdAt ?? new Date().toISOString(),
        };
      });
    } catch {
      this.users = this.seedUsers();
    }
  }

  private persistUsers(): void {
    const usersForAuth = this.users.map((user) => ({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      password: user.password,
      role: user.role,
      active: user.status === 'ACTIVO',
      createdAt: user.createdAt,
    }));
    localStorage.setItem(USERS_KEY, JSON.stringify(usersForAuth));
  }

  private seedUsers(): UserItem[] {
    return [
      {
        id: crypto.randomUUID(),
        fullName: 'Admin TitiShop',
        email: 'admin@titishop.pe',
        role: 'ADMINISTRADOR',
        status: 'ACTIVO',
        password: DEFAULT_PASSWORD,
        createdAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        fullName: 'Almacén Principal',
        email: 'almacen@titishop.pe',
        role: 'ALMACENERO',
        status: 'ACTIVO',
        password: DEFAULT_PASSWORD,
        createdAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        fullName: 'Sonia Supervisora',
        email: 'supervisor@titishop.pe',
        role: 'SUPERVISOR',
        status: 'ACTIVO',
        password: DEFAULT_PASSWORD,
        createdAt: new Date().toISOString(),
      },
    ];
  }
}
