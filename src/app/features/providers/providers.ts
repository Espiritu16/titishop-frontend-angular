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
  isSubmitting = false;

  readonly providerForm;

  constructor(private fb: FormBuilder) {
    this.providerForm = this.fb.nonNullable.group({
      businessName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
      ruc: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      contact: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{6,9}$/)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
      address: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(120)]],
    });
    this.loadProviders();
  }

  saveProvider(): void {
    if (this.isSubmitting) {
      return;
    }

    if (this.providerForm.invalid) {
      this.providerForm.markAllAsTouched();
      this.feedback = 'Completa correctamente los campos requeridos.';
      return;
    }

    this.isSubmitting = true;

    try {
      const value = this.providerForm.getRawValue();
      const normalizedBusinessName = this.normalizeText(value.businessName);
      const normalizedContact = this.normalizeText(value.contact);
      const normalizedAddress = this.normalizeText(value.address);
      const normalizedRuc = value.ruc.replace(/\D/g, '').trim();
      const normalizedPhone = value.phone.replace(/\D/g, '').trim();
      const normalizedEmail = value.email.trim().toLowerCase().replace(/\s+/g, '');

      const rucExists = this.providers.some((p) => p.ruc === normalizedRuc && p.id !== this.editingId);
      if (rucExists) {
        this.feedback = 'El RUC ya existe.';
        return;
      }

      const emailExists = this.providers.some((p) => p.email === normalizedEmail && p.id !== this.editingId);
      if (emailExists) {
        this.feedback = 'El correo ya existe.';
        return;
      }

      if (this.editingId) {
        this.providers = this.providers.map((item) =>
          item.id === this.editingId
            ? {
                ...item,
                businessName: normalizedBusinessName,
                ruc: normalizedRuc,
                contact: normalizedContact,
                phone: normalizedPhone,
                email: normalizedEmail,
                address: normalizedAddress,
              }
            : item
        );
        this.feedback = 'Proveedor actualizado correctamente.';
      } else {
        const item: ProviderItem = {
          id: crypto.randomUUID(),
          businessName: normalizedBusinessName,
          ruc: normalizedRuc,
          contact: normalizedContact,
          phone: normalizedPhone,
          email: normalizedEmail,
          address: normalizedAddress,
          status: 'ACTIVO',
          createdAt: new Date().toISOString(),
        };
        this.providers = [item, ...this.providers];
        this.feedback = 'Proveedor registrado correctamente.';
      }

      this.persist();
      this.cancelEdit();
    } finally {
      this.isSubmitting = false;
    }
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

  onRucInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 11);
    this.providerForm.controls.ruc.setValue(digits, { emitEvent: false });
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 9);
    this.providerForm.controls.phone.setValue(digits, { emitEvent: false });
  }

  onContactInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 9);
    this.providerForm.controls.contact.setValue(digits, { emitEvent: false });
  }

  onEmailInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cleaned = input.value.replace(/\s+/g, '').toLowerCase();
    this.providerForm.controls.email.setValue(cleaned, { emitEvent: false });
  }

  onAddressInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cleaned = input.value.replace(/\s{2,}/g, ' ');
    this.providerForm.controls.address.setValue(cleaned, { emitEvent: false });
  }

  canSubmit(): boolean {
    return this.providerForm.valid && !this.isSubmitting;
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

  private normalizeText(value: string): string {
    return value.trim().replace(/\s{2,}/g, ' ');
  }

  private seedProviders(): ProviderItem[] {
    return [
      {
        id: crypto.randomUUID(),
        businessName: 'Nova Import SAC',
        ruc: '20609998881',
        contact: '987654321',
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
        contact: '976543210',
        phone: '976543210',
        email: 'contacto@andessupply.pe',
        address: 'Jr. Comercio 112, Arequipa',
        status: 'ACTIVO',
        createdAt: new Date().toISOString(),
      },
    ];
  }
}
