import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';

type StockStatus = 'NORMAL' | 'BAJO' | 'AGOTADO';

interface InventoryItem {
  id: string;
  product: string;
  sku: string;
  category: string;
  stock: number;
  minStock: number;
  location: string;
  updatedAt: string;
}

const INVENTORY_KEY = 'titishop_inventario';

@Component({
  selector: 'app-inventory',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './inventory.html',
  styleUrl: './inventory.scss',
})
export class Inventory {
  feedback = '';
  editingId: string | null = null;
  inventory: InventoryItem[] = [];

  readonly inventoryForm;

  constructor(private fb: FormBuilder) {
    this.inventoryForm = this.fb.nonNullable.group({
      product: ['', [Validators.required, Validators.minLength(3)]],
      sku: ['', [Validators.required, Validators.minLength(3)]],
      category: ['', [Validators.required, Validators.minLength(3)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      minStock: [0, [Validators.required, Validators.min(0)]],
      location: ['', [Validators.required, Validators.minLength(2)]],
    });
    this.loadInventory();
  }

  saveItem(): void {
    if (this.inventoryForm.invalid) {
      this.inventoryForm.markAllAsTouched();
      this.feedback = 'Completa correctamente los campos obligatorios.';
      return;
    }

    const value = this.inventoryForm.getRawValue();
    const normalizedSku = value.sku.trim().toUpperCase();
    const skuExists = this.inventory.some((item) => item.sku === normalizedSku && item.id !== this.editingId);
    if (skuExists) {
      this.feedback = 'El SKU ya existe en inventario.';
      return;
    }

    if (this.editingId) {
      this.inventory = this.inventory.map((item) =>
        item.id === this.editingId
          ? {
              ...item,
              product: value.product.trim(),
              sku: normalizedSku,
              category: value.category.trim(),
              stock: value.stock,
              minStock: value.minStock,
              location: value.location.trim(),
              updatedAt: new Date().toISOString(),
            }
          : item
      );
      this.feedback = 'Registro de inventario actualizado.';
    } else {
      const newItem: InventoryItem = {
        id: crypto.randomUUID(),
        product: value.product.trim(),
        sku: normalizedSku,
        category: value.category.trim(),
        stock: value.stock,
        minStock: value.minStock,
        location: value.location.trim(),
        updatedAt: new Date().toISOString(),
      };
      this.inventory = [newItem, ...this.inventory];
      this.feedback = 'Registro de inventario creado.';
    }

    this.persist();
    this.cancelEdit();
  }

  editItem(item: InventoryItem): void {
    this.editingId = item.id;
    this.inventoryForm.setValue({
      product: item.product,
      sku: item.sku,
      category: item.category,
      stock: item.stock,
      minStock: item.minStock,
      location: item.location,
    });
    this.feedback = `Editando ${item.product}.`;
  }

  cancelEdit(): void {
    this.editingId = null;
    this.inventoryForm.reset({
      product: '',
      sku: '',
      category: '',
      stock: 0,
      minStock: 0,
      location: '',
    });
  }

  removeItem(id: string): void {
    this.inventory = this.inventory.filter((item) => item.id !== id);
    this.persist();
    this.feedback = 'Registro eliminado.';
  }

  stockStatus(item: InventoryItem): StockStatus {
    if (item.stock <= 0) return 'AGOTADO';
    if (item.stock <= item.minStock) return 'BAJO';
    return 'NORMAL';
  }

  stockBadgeClass(item: InventoryItem): string {
    const status = this.stockStatus(item);
    if (status === 'AGOTADO') return 'badge text-bg-danger';
    if (status === 'BAJO') return 'badge text-bg-warning';
    return 'badge text-bg-success';
  }

  private loadInventory(): void {
    const raw = localStorage.getItem(INVENTORY_KEY);
    if (!raw) {
      this.inventory = this.seedInventory();
      this.persist();
      return;
    }
    try {
      const parsed = JSON.parse(raw) as InventoryItem[];
      this.inventory = Array.isArray(parsed) ? parsed : this.seedInventory();
    } catch {
      this.inventory = this.seedInventory();
    }
  }

  private persist(): void {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(this.inventory));
  }

  private seedInventory(): InventoryItem[] {
    return [
      {
        id: crypto.randomUUID(),
        product: 'Mouse inalámbrico',
        sku: 'TITI-MOU-01',
        category: 'Tecnología',
        stock: 22,
        minStock: 8,
        location: 'A-01',
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        product: 'Lámpara LED escritorio',
        sku: 'TITI-HOG-15',
        category: 'Hogar',
        stock: 6,
        minStock: 10,
        location: 'B-03',
        updatedAt: new Date().toISOString(),
      },
    ];
  }
}
