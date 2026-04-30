import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

type ProductStatus = 'ACTIVO' | 'INACTIVO';

interface ProductItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  brand: string;
  purchasePrice: number;
  salePrice: number;
  status: ProductStatus;
  createdAt: string;
}

const PRODUCTS_KEY = 'titishop_productos';

@Component({
  selector: 'app-products',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './products.html',
  styleUrl: './products.scss',
})
export class Products {
  feedback = '';
  editingId: string | null = null;
  products: ProductItem[] = [];

  readonly categories = ['Accesorios', 'Tecnología', 'Hogar', 'Oficina'];
  readonly brands = ['TitiHome', 'NovaTech', 'Andes', 'Genérico'];

  readonly productForm;

  constructor(private fb: FormBuilder) {
    this.productForm = this.fb.nonNullable.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      sku: ['', [Validators.required, Validators.minLength(3)]],
      category: [this.categories[0], [Validators.required]],
      brand: [this.brands[0], [Validators.required]],
      purchasePrice: [null as number | null, [Validators.required, Validators.min(0)]],
      salePrice: [null as number | null, [Validators.required, Validators.min(0)]],
    });
    this.loadProducts();
  }

  get canSubmit(): boolean {
    const { name, sku } = this.productForm.getRawValue();
    return this.productForm.valid && !!name.trim() && !!sku.trim();
  }

  blockInvalidNumberKeys(event: KeyboardEvent): void {
    if (['e', 'E', '+', '-'].includes(event.key)) {
      event.preventDefault();
    }
  }

  saveProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.feedback = 'Completa correctamente los campos obligatorios.';
      return;
    }

    const value = this.productForm.getRawValue();
    const normalizedName = value.name.trim().replace(/\s+/g, ' ');
    const normalizedSku = value.sku.trim().toUpperCase();

    if (!normalizedName) {
      this.feedback = 'Ingrese el nombre del producto.';
      return;
    }

    if (!normalizedSku) {
      this.feedback = 'Ingrese el SKU del producto.';
      return;
    }

    if (value.purchasePrice === null || value.salePrice === null) {
      this.feedback = 'Ingrese precios válidos.';
      return;
    }

    const purchasePrice = value.purchasePrice;
    const salePrice = value.salePrice;

    const skuExists = this.products.some((p) => p.sku === normalizedSku && p.id !== this.editingId);
    if (skuExists) {
      this.feedback = 'El SKU ya existe.';
      return;
    }

    if (salePrice < purchasePrice) {
      this.feedback = 'El precio de venta no puede ser menor al de compra.';
      return;
    }

    if (this.editingId) {
      this.products = this.products.map((p) =>
        p.id === this.editingId
          ? {
              ...p,
              name: normalizedName,
              sku: normalizedSku,
              category: value.category,
              brand: value.brand,
              purchasePrice,
              salePrice,
            }
          : p
      );
      this.feedback = 'Producto actualizado correctamente.';
    } else {
      const item: ProductItem = {
        id: crypto.randomUUID(),
        name: normalizedName,
        sku: normalizedSku,
        category: value.category,
        brand: value.brand,
        purchasePrice,
        salePrice,
        status: 'ACTIVO',
        createdAt: new Date().toISOString(),
      };
      this.products = [item, ...this.products];
      this.feedback = 'Producto registrado correctamente.';
    }

    this.persist();
    this.cancelEdit();
  }

  editProduct(item: ProductItem): void {
    this.editingId = item.id;
    this.productForm.setValue({
      name: item.name,
      sku: item.sku,
      category: item.category,
      brand: item.brand,
      purchasePrice: item.purchasePrice,
      salePrice: item.salePrice,
    });
    this.feedback = `Editando producto ${item.name}.`;
  }

  cancelEdit(): void {
    this.editingId = null;
    this.productForm.reset({
      name: '',
      sku: '',
      category: this.categories[0],
      brand: this.brands[0],
      purchasePrice: null,
      salePrice: null,
    });
  }

  toggleStatus(id: string): void {
    this.products = this.products.map((p) =>
      p.id === id ? { ...p, status: p.status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO' } : p
    );
    this.persist();
  }

  deleteProduct(id: string): void {
    this.products = this.products.filter((p) => p.id !== id);
    this.persist();
    this.feedback = 'Producto eliminado.';
  }

  statusBadgeClass(status: ProductStatus): string {
    return status === 'ACTIVO' ? 'badge text-bg-success' : 'badge text-bg-secondary';
  }

  private loadProducts(): void {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (!raw) {
      this.products = this.seedProducts();
      this.persist();
      return;
    }

    try {
      const parsed = JSON.parse(raw) as ProductItem[];
      this.products = Array.isArray(parsed) ? parsed : this.seedProducts();
    } catch {
      this.products = this.seedProducts();
    }
  }

  private persist(): void {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(this.products));
  }

  private seedProducts(): ProductItem[] {
    return [
      {
        id: crypto.randomUUID(),
        name: 'Mouse inalámbrico',
        sku: 'TITI-MOU-01',
        category: 'Tecnología',
        brand: 'NovaTech',
        purchasePrice: 35,
        salePrice: 55,
        status: 'ACTIVO',
        createdAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        name: 'Lámpara LED escritorio',
        sku: 'TITI-HOG-15',
        category: 'Hogar',
        brand: 'TitiHome',
        purchasePrice: 42,
        salePrice: 68,
        status: 'ACTIVO',
        createdAt: new Date().toISOString(),
      },
    ];
  }
}
