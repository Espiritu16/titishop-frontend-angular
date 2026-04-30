import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

type MovementType = 'ENTRADA' | 'SALIDA' | 'AJUSTE';

interface MovementItem {
  id: string;
  createdAt: string;
  type: MovementType;
  product: string;
  sku: string;
  quantity: number;
  reason: string;
  user: string;
}

interface StockItem {
  sku: string;
  product: string;
  stock: number;
}

const MOVEMENTS_KEY = 'titishop_movimientos';
const STOCK_KEY = 'titishop_stock';

@Component({
  selector: 'app-movements',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './movements.html',
  styleUrl: './movements.scss',
})
export class Movements {
  feedback = '';
  isSubmitting = false;
  private lastSubmitAt = 0;

  movements: MovementItem[] = [];
  stock: StockItem[] = [];

  readonly movementTypes: MovementType[] = ['ENTRADA', 'SALIDA', 'AJUSTE'];

  readonly movementForm;

  constructor(private fb: FormBuilder) {
    this.movementForm = this.fb.nonNullable.group({
      type: ['ENTRADA' as MovementType, [Validators.required]],
      product: ['', [Validators.required, Validators.minLength(3)]],
      sku: ['', [Validators.required, Validators.minLength(3)]],
      quantity: [0, [Validators.required, Validators.min(1)]],
      reason: ['', [Validators.required, Validators.minLength(4)]],
      user: ['Operador', [Validators.required, Validators.minLength(3)]],
    });
    this.loadData();
  }

  submitMovement(): void {
    const now = Date.now();
    if (this.isSubmitting) return;
    if (now - this.lastSubmitAt < 400) return;
    this.lastSubmitAt = now;

    if (this.movementForm.invalid) {
      this.movementForm.markAllAsTouched();
      this.feedback = 'Completa correctamente los campos obligatorios.';
      return;
    }

    this.isSubmitting = true;
    try {
      const value = this.movementForm.getRawValue();
      const sku = value.sku.trim().toUpperCase();
      const product = value.product.trim();
      const existingStock = this.stock.find((item) => item.sku === sku);

      if (!existingStock) {
        this.stock.push({ sku, product, stock: 0 });
      } else {
        existingStock.product = product;
      }

      const stockItem = this.stock.find((item) => item.sku === sku)!;

      if (value.type === 'SALIDA' && stockItem.stock < value.quantity) {
        this.feedback = `Stock insuficiente. Disponible: ${stockItem.stock}.`;
        return;
      }

      if (value.type === 'ENTRADA') {
        stockItem.stock += value.quantity;
      } else if (value.type === 'SALIDA') {
        stockItem.stock -= value.quantity;
      } else {
        stockItem.stock = value.quantity;
      }

      const movement: MovementItem = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        type: value.type,
        product,
        sku,
        quantity: value.quantity,
        reason: value.reason.trim(),
        user: value.user.trim(),
      };

      this.movements = [movement, ...this.movements];
      this.persistData();
      this.feedback = 'Movimiento registrado correctamente.';
      this.movementForm.patchValue({
        quantity: 0,
        reason: '',
      });
    } finally {
      this.isSubmitting = false;
    }
  }

  availableStock(sku: string): number {
    return this.stock.find((item) => item.sku === sku.trim().toUpperCase())?.stock ?? 0;
  }

  movementBadgeClass(type: MovementType): string {
    if (type === 'ENTRADA') return 'badge text-bg-success';
    if (type === 'SALIDA') return 'badge text-bg-primary';
    return 'badge text-bg-secondary';
  }

  private loadData(): void {
    const rawMovements = localStorage.getItem(MOVEMENTS_KEY);
    const rawStock = localStorage.getItem(STOCK_KEY);

    try {
      this.movements = rawMovements ? (JSON.parse(rawMovements) as MovementItem[]) : [];
    } catch {
      this.movements = [];
    }

    try {
      this.stock = rawStock
        ? (JSON.parse(rawStock) as StockItem[])
        : [
            { sku: 'TITI-MOU-01', product: 'Mouse inalámbrico', stock: 22 },
            { sku: 'TITI-HOG-15', product: 'Lámpara LED escritorio', stock: 6 },
          ];
      this.persistData();
    } catch {
      this.stock = [];
    }
  }

  private persistData(): void {
    localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(this.movements));
    localStorage.setItem(STOCK_KEY, JSON.stringify(this.stock));
  }
}
