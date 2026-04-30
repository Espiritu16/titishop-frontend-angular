import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';

type StockStatus = 'NORMAL' | 'BAJO' | 'AGOTADO';
type RecordStatus = 'ACTIVO' | 'INACTIVO';

interface InventoryItem {
  id: string;
  product: string;
  sku: string;
  category: string;
  stock: number;
  minStock: number;
  recordStatus: RecordStatus;
  location: string;
  updatedAt: string;
}

interface ProductRef {
  sku: string;
  name: string;
  category: string;
}

const INVENTORY_KEY = 'titishop_inventario';
const PRODUCTS_KEY = 'titishop_productos';
const STOCK_KEY = 'titishop_stock';

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
  productsRef: ProductRef[] = [];
  productQuery = '';
  filteredProducts: ProductRef[] = [];
  showProductSuggestions = false;

  readonly inventoryForm;

  constructor(private fb: FormBuilder) {
    this.inventoryForm = this.fb.group({
      product: ['', [Validators.required, Validators.minLength(3)]],
      sku: ['', [Validators.required, Validators.minLength(3)]],
      category: ['', [Validators.required, Validators.minLength(3)]],
      minStock: [null as number | null, [Validators.required, Validators.min(0)]],
      location: ['', [Validators.required, Validators.minLength(2)]],
    });
    this.loadInventory();
    this.cancelEdit();
  }

  onProductInput(): void {
    const productValue = this.inventoryForm.controls.product.value ?? '';
    const query = productValue.trim().toLowerCase();
    this.productQuery = query;
    if (!query) {
      this.filteredProducts = [];
      this.showProductSuggestions = false;
      return;
    }
    this.filteredProducts = this.productsRef.filter((item) => item.name.toLowerCase().includes(query)).slice(0, 8);
    this.showProductSuggestions = this.filteredProducts.length > 0;
  }

  selectProduct(product: ProductRef): void {
    this.inventoryForm.patchValue({
      product: product.name,
      sku: product.sku,
      category: product.category,
    });
    this.showProductSuggestions = false;
  }

  blockInvalidNumberKeys(event: KeyboardEvent): void {
    if (['e', 'E', '+', '-'].includes(event.key)) {
      event.preventDefault();
    }
  }

  saveItem(): void {
    if (this.inventoryForm.invalid) {
      this.inventoryForm.markAllAsTouched();
      this.feedback = 'Completa correctamente los campos obligatorios.';
      return;
    }

    const value = this.inventoryForm.getRawValue();
    const normalizedProduct = (value.product ?? '').trim().replace(/\s+/g, ' ');
    const normalizedSku = (value.sku ?? '').trim().toUpperCase();
    const normalizedCategory = (value.category ?? '').trim().replace(/\s+/g, ' ');
    const normalizedLocation = (value.location ?? '').trim().replace(/\s+/g, ' ');
    const minStock = value.minStock;

    if (!normalizedProduct || !normalizedSku || !normalizedCategory || !normalizedLocation || minStock === null) {
      this.feedback = 'Completa correctamente los campos obligatorios.';
      return;
    }

    const stockMap = this.readStockMap();
    const existingBySku = this.inventory.find((item) => item.sku === normalizedSku);

    if (!this.editingId && existingBySku) {
      this.inventory = this.inventory.map((item) =>
        item.sku === normalizedSku
          ? {
              ...item,
              product: normalizedProduct,
              category: normalizedCategory,
              stock: stockMap.get(normalizedSku) ?? item.stock,
              minStock,
              recordStatus: item.recordStatus,
              location: normalizedLocation,
              updatedAt: new Date().toISOString(),
            }
          : item
      );
      this.persist();
      this.cancelEdit();
      this.feedback = 'Inventario actualizado para el producto seleccionado.';
      return;
    }

    if (this.editingId) {
      this.inventory = this.inventory.map((item) =>
        item.id === this.editingId
          ? {
              ...item,
              product: normalizedProduct,
              sku: normalizedSku,
              category: normalizedCategory,
              stock: stockMap.get(normalizedSku) ?? item.stock,
              minStock,
              recordStatus: item.recordStatus,
              location: normalizedLocation,
              updatedAt: new Date().toISOString(),
            }
          : item
      );
      this.feedback = 'Registro de inventario actualizado.';
    } else {
      const newItem: InventoryItem = {
        id: crypto.randomUUID(),
        product: normalizedProduct,
        sku: normalizedSku,
        category: normalizedCategory,
        stock: stockMap.get(normalizedSku) ?? 0,
        minStock,
        recordStatus: 'ACTIVO',
        location: normalizedLocation,
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
      minStock: null,
      location: '',
    });
  }

  toggleRecordStatus(id: string): void {
    this.inventory = this.inventory.map((item) =>
      item.id === id
        ? { ...item, recordStatus: item.recordStatus === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO', updatedAt: new Date().toISOString() }
        : item
    );
    this.persist();
    this.feedback = 'Estado de registro actualizado.';
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

  recordStatusBadgeClass(status: RecordStatus): string {
    return status === 'ACTIVO' ? 'badge text-bg-success' : 'badge text-bg-secondary';
  }

  private loadInventory(): void {
    const products = this.readProducts();
    this.productsRef = products;
    const productMap = new Map(products.map((p) => [p.sku, { name: p.name, category: p.category }]));
    const stockMap = this.readStockMap();
    const raw = localStorage.getItem(INVENTORY_KEY);
    const baseInventory = this.seedInventory();

    if (!raw) {
      this.inventory = baseInventory;
      this.persist();
      return;
    }

    try {
      const parsed = JSON.parse(raw) as InventoryItem[];
      const fromStorage = Array.isArray(parsed) ? parsed : baseInventory;

      const mapped = fromStorage.map((item) => {
        const product = productMap.get(item.sku);
        const stock = stockMap.get(item.sku) ?? item.stock;
        return {
          ...item,
          product: product?.name ?? item.product,
          category: product?.category ?? item.category,
          stock,
          recordStatus: item.recordStatus ?? 'ACTIVO',
        };
      });

      const missingProducts = products
        .filter((product) => !mapped.some((item) => item.sku === product.sku))
        .map((product): InventoryItem => ({
          id: crypto.randomUUID(),
          product: product.name,
          sku: product.sku,
          category: product.category,
          stock: stockMap.get(product.sku) ?? 0,
          minStock: 0,
          recordStatus: 'ACTIVO',
          location: '',
          updatedAt: new Date().toISOString(),
        }));

      this.inventory = [...mapped, ...missingProducts];
    } catch {
      this.inventory = baseInventory;
    }
  }

  private persist(): void {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(this.inventory));
  }

  private seedInventory(): InventoryItem[] {
    const products = this.readProducts();
    const productMap = new Map(products.map((p) => [p.sku, { name: p.name, category: p.category }]));
    const stockMap = this.readStockMap();
    return [
      {
        id: crypto.randomUUID(),
        product: productMap.get('TITI-MOU-01')?.name ?? 'Mouse inalámbrico',
        sku: 'TITI-MOU-01',
        category: productMap.get('TITI-MOU-01')?.category ?? 'Tecnología',
        stock: stockMap.get('TITI-MOU-01') ?? 22,
        minStock: 8,
        recordStatus: 'ACTIVO',
        location: 'A-01',
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        product: productMap.get('TITI-HOG-15')?.name ?? 'Lámpara LED escritorio',
        sku: 'TITI-HOG-15',
        category: productMap.get('TITI-HOG-15')?.category ?? 'Hogar',
        stock: stockMap.get('TITI-HOG-15') ?? 6,
        minStock: 10,
        recordStatus: 'ACTIVO',
        location: 'B-03',
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  private readProducts(): ProductRef[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(PRODUCTS_KEY) ?? '[]') as Array<{ sku: string; name: string; category: string }>;
      return parsed
        .filter((item) => !!item?.sku && !!item?.name)
        .map((item) => ({
          sku: item.sku,
          name: item.name,
          category: item.category ?? '',
        }));
    } catch {
      return [];
    }
  }

  private readStockMap(): Map<string, number> {
    try {
      const parsed = JSON.parse(localStorage.getItem(STOCK_KEY) ?? '[]') as Array<{ sku: string; stock: number }>;
      const map = new Map<string, number>();
      parsed.forEach((item) => {
        if (!item?.sku) return;
        map.set(item.sku, Number.isFinite(item.stock) ? item.stock : 0);
      });
      return map;
    } catch {
      return new Map<string, number>();
    }
  }
}
