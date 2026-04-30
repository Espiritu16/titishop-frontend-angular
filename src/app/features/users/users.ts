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
  createdAt: string;
}

const USERS_KEY = 'titishop_usuarios';

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

  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.nonNullable.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['ALMACENERO' as UserRole, [Validators.required]],
    });
    this.loadUsers();
  }

  saveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      this.feedback = 'Completa correctamente los campos requeridos.';
      return;
    }

    const formValue = this.userForm.getRawValue();
    const normalizedEmail = formValue.email.trim().toLowerCase();

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
              fullName: formValue.fullName.trim(),
              email: normalizedEmail,
              role: formValue.role,
            }
          : user
      );
      this.feedback = 'Usuario actualizado correctamente.';
    } else {
      const newUser: UserItem = {
        id: crypto.randomUUID(),
        fullName: formValue.fullName.trim(),
        email: normalizedEmail,
        role: formValue.role,
        status: 'ACTIVO',
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
  }

  statusBadgeClass(status: UserStatus): string {
    return status === 'ACTIVO' ? 'badge text-bg-success' : 'badge text-bg-secondary';
  }

  private loadUsers(): void {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      this.users = this.seedUsers();
      this.persistUsers();
      return;
    }

    try {
      const parsed = JSON.parse(raw) as UserItem[];
      this.users = Array.isArray(parsed) ? parsed : this.seedUsers();
    } catch {
      this.users = this.seedUsers();
    }
  }

  private persistUsers(): void {
    localStorage.setItem(USERS_KEY, JSON.stringify(this.users));
  }

  private seedUsers(): UserItem[] {
    return [
      {
        id: crypto.randomUUID(),
        fullName: 'Admin TitiShop',
        email: 'admin@titishop.pe',
        role: 'ADMINISTRADOR',
        status: 'ACTIVO',
        createdAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        fullName: 'Almacén Principal',
        email: 'almacen@titishop.pe',
        role: 'ALMACENERO',
        status: 'ACTIVO',
        createdAt: new Date().toISOString(),
      },
    ];
  }
}
