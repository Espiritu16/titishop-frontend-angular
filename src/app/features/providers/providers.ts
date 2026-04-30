import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

type ProviderStatus = 'ACTIVO' | 'INACTIVO';

interface ProviderItem {
  id: string;
  businessName: string;
  ruc: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  status: ProviderStatus;
  createdAt: string;
}

const PROVIDERS_KEY = 'titishop_proveedores';

@Component({
  selector: 'app-providers',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './providers.html',
  styleUrl: './providers.scss',
})
export class Providers {
  feedback = '';
  editingId: string | null = null;
  providers: ProviderItem[] = [];

  readonly providerForm;

  constructor(private fb: FormBuilder) {
    this.providerForm = this.fb.nonNullable.group({
      businessName: ['', [Validators.required, Validators.minLength(3)]],
      ruc: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      contact: ['', [Validators.required, Validators.minLength(3)]],
      phone: ['', [Validators.required, Validators.minLength(6)]],
      email: ['', [Validators.required, Validators.email]],
      address: ['', [Validators.required, Validators.minLength(5)]],
    });
    this.loadProviders();
  }

  saveProvider(): void {
    if (this.providerForm.invalid) {
      this.providerForm.markAllAsTouched();
      this.feedback = 'Completa correctamente los campos requeridos.';
      return;
    }

    const value = this.providerForm.getRawValue();
    const normalizedRuc = value.ruc.trim();
    const normalizedEmail = value.email.trim().toLowerCase();

    const rucExists = this.providers.some((p) => p.ruc === normalizedRuc && p.id !== this.editingId);
    if (rucExists) {
      this.feedback = 'El RUC ya existe.';
      return;
    }

    if (this.editingId) {
      this.providers = this.providers.map((item) =>
        item.id === this.editingId
          ? {
              ...item,
              businessName: value.businessName.trim(),
              ruc: normalizedRuc,
              contact: value.contact.trim(),
              phone: value.phone.trim(),
              email: normalizedEmail,
              address: value.address.trim(),
            }
          : item
      );
      this.feedback = 'Proveedor actualizado correctamente.';
    } else {
      const item: ProviderItem = {
        id: crypto.randomUUID(),
        businessName: value.businessName.trim(),
        ruc: normalizedRuc,
        contact: value.contact.trim(),
        phone: value.phone.trim(),
        email: normalizedEmail,
        address: value.address.trim(),
        status: 'ACTIVO',
        createdAt: new Date().toISOString(),
      };
      this.providers = [item, ...this.providers];
      this.feedback = 'Proveedor registrado correctamente.';
    }

    this.persist();
    this.cancelEdit();
  }

  editProvider(item: ProviderItem): void {
    this.editingId = item.id;
    this.providerForm.setValue({
      businessName: item.businessName,
      ruc: item.ruc,
      contact: item.contact,
      phone: item.phone,
      email: item.email,
      address: item.address,
    });
    this.feedback = `Editando proveedor ${item.businessName}.`;
  }

  cancelEdit(): void {
    this.editingId = null;
    this.providerForm.reset({
      businessName: '',
      ruc: '',
      contact: '',
      phone: '',
      email: '',
      address: '',
    });
  }

  toggleStatus(id: string): void {
    this.providers = this.providers.map((item) =>
      item.id === id ? { ...item, status: item.status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO' } : item
    );
    this.persist();
  }

  removeProvider(id: string): void {
    this.providers = this.providers.filter((item) => item.id !== id);
    this.persist();
    this.feedback = 'Proveedor eliminado.';
  }

  statusBadgeClass(status: ProviderStatus): string {
    return status === 'ACTIVO' ? 'badge text-bg-success' : 'badge text-bg-secondary';
  }

  private loadProviders(): void {
    const raw = localStorage.getItem(PROVIDERS_KEY);
    if (!raw) {
      this.providers = this.seedProviders();
      this.persist();
      return;
    }

    try {
      const parsed = JSON.parse(raw) as ProviderItem[];
      this.providers = Array.isArray(parsed) ? parsed : this.seedProviders();
    } catch {
      this.providers = this.seedProviders();
    }
  }

  private persist(): void {
    localStorage.setItem(PROVIDERS_KEY, JSON.stringify(this.providers));
  }

  private seedProviders(): ProviderItem[] {
    return [
      {
        id: crypto.randomUUID(),
        businessName: 'Nova Import SAC',
        ruc: '20609998881',
        contact: 'María Tello',
        phone: '987654321',
        email: 'ventas@novaimport.pe',
        address: 'Av. Industrial 450, Lima',
        status: 'ACTIVO',
        createdAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        businessName: 'Andes Supply EIRL',
        ruc: '20607776661',
        contact: 'Luis Paredes',
        phone: '976543210',
        email: 'contacto@andessupply.pe',
        address: 'Jr. Comercio 112, Arequipa',
        status: 'ACTIVO',
        createdAt: new Date().toISOString(),
      },
    ];
  }
}
