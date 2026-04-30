import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth.service';

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

interface ProductRef {
  sku: string;
  name: string;
}

const MOVEMENTS_KEY = 'titishop_movimientos';
const STOCK_KEY = 'titishop_stock';
const PRODUCTS_KEY = 'titishop_productos';

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
  productsRef: ProductRef[] = [];
  filteredProducts: ProductRef[] = [];
  showProductSuggestions = false;

  readonly movementTypes: MovementType[] = ['ENTRADA', 'SALIDA', 'AJUSTE'];

  readonly movementForm;

  constructor(
    private fb: FormBuilder,
    public auth: AuthService
  ) {
    this.movementForm = this.fb.nonNullable.group({
      type: ['ENTRADA' as MovementType, [Validators.required]],
      product: ['', [Validators.required, Validators.minLength(3)]],
      sku: ['', [Validators.required, Validators.minLength(3)]],
      quantity: [0, [Validators.required, Validators.min(1)]],
      reason: ['', [Validators.required, Validators.minLength(4)]],
      user: [this.auth.session()?.fullName ?? 'Operador', [Validators.required, Validators.minLength(3)]],
    });
    this.loadData();
  }

  onProductInput(): void {
    const query = this.movementForm.controls.product.value.trim().toLowerCase();
    if (!query) {
      this.filteredProducts = [];
      this.showProductSuggestions = false;
      return;
    }
    this.filteredProducts = this.productsRef.filter((item) => item.name.toLowerCase().includes(query)).slice(0, 8);
    this.showProductSuggestions = this.filteredProducts.length > 0;
  }

  selectProduct(product: ProductRef): void {
    this.movementForm.patchValue({
      product: product.name,
      sku: product.sku,
    });
    this.showProductSuggestions = false;
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
      const productExists = this.productsRef.some((item) => item.sku === sku && item.name.toLowerCase() === product.toLowerCase());
      if (!productExists) {
        this.feedback = 'Seleccione un producto válido del listado.';
        return;
      }

      const existingStock = this.stock.find((item) => item.sku === sku);
      if (existingStock) existingStock.product = product;

      const stockItem = this.stock.find((item) => item.sku === sku) ?? { sku, product, stock: 0 };

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
        user: this.auth.session()?.fullName ?? 'Operador',
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

    try {
      const parsed = JSON.parse(localStorage.getItem(PRODUCTS_KEY) ?? '[]') as Array<{ sku: string; name: string }>;
      this.productsRef = parsed
        .filter((item) => !!item?.sku && !!item?.name)
        .map((item) => ({ sku: item.sku, name: item.name }));
    } catch {
      this.productsRef = [];
    }
  }

  private persistData(): void {
    localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(this.movements));
    localStorage.setItem(STOCK_KEY, JSON.stringify(this.stock));
  }
}
