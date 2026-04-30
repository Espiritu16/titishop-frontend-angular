import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

type MovementType = 'ENTRADA' | 'SALIDA' | 'AJUSTE';

interface ReportMovement {
  id: string;
  date: string;
  type: MovementType;
  product: string;
  sku: string;
  provider: string;
  quantity: number;
  reason: string;
  user: string;
}

const MOVEMENTS_KEY = 'titishop_movimientos';
const PRODUCTS_KEY = 'titishop_productos';
const PROVIDERS_KEY = 'titishop_proveedores';

@Component({
  selector: 'app-reports',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export class Reports {
  readonly movementTypes: Array<MovementType | 'TODOS'> = ['TODOS', 'ENTRADA', 'SALIDA', 'AJUSTE'];
  providers: string[] = ['Todos'];
  products: string[] = ['Todos'];
  filteredProducts: string[] = [];
  showProductSuggestions = false;

  readonly filterForm;
  allMovements: ReportMovement[] = [];

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.nonNullable.group({
      fromDate: [''],
      toDate: [''],
      type: ['TODOS' as MovementType | 'TODOS'],
      provider: ['Todos'],
      product: [''],
    });
    this.loadMovements();
  }

  get filteredMovements(): ReportMovement[] {
    const { fromDate, toDate, type, provider, product } = this.filterForm.getRawValue();
    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
    const to = toDate ? new Date(`${toDate}T23:59:59`) : null;

    return this.allMovements.filter((movement) => {
      const movementDate = new Date(movement.date);
      if (from && movementDate < from) return false;
      if (to && movementDate > to) return false;
      if (type !== 'TODOS' && movement.type !== type) return false;
      if (provider !== 'Todos' && movement.provider !== provider) return false;
      const normalizedProduct = product.trim().toLowerCase();
      if (normalizedProduct && normalizedProduct !== 'todos' && movement.product.toLowerCase() !== normalizedProduct) return false;
      return true;
    });
  }

  get totalEntradas(): number {
    return this.filteredMovements.filter((m) => m.type === 'ENTRADA').reduce((acc, curr) => acc + curr.quantity, 0);
  }

  get totalSalidas(): number {
    return this.filteredMovements.filter((m) => m.type === 'SALIDA').reduce((acc, curr) => acc + curr.quantity, 0);
  }

  get totalAjustes(): number {
    return this.filteredMovements.filter((m) => m.type === 'AJUSTE').reduce((acc, curr) => acc + curr.quantity, 0);
  }

  clearFilters(): void {
    this.filterForm.reset({
      fromDate: '',
      toDate: '',
      type: 'TODOS',
      provider: 'Todos',
      product: '',
    });
    this.filteredProducts = [...this.products];
    this.showProductSuggestions = false;
  }

  movementBadgeClass(type: MovementType): string {
    if (type === 'ENTRADA') return 'badge text-bg-success';
    if (type === 'SALIDA') return 'badge text-bg-primary';
    return 'badge text-bg-secondary';
  }

  private loadMovements(): void {
    try {
      const parsed = JSON.parse(localStorage.getItem(MOVEMENTS_KEY) ?? '[]') as Array<Partial<ReportMovement>>;
      this.allMovements = Array.isArray(parsed)
        ? parsed.map((item) => ({
            id: item.id ?? crypto.randomUUID(),
            date: item.date ?? new Date().toISOString(),
            type: (item.type as MovementType) ?? 'ENTRADA',
            product: item.product ?? '',
            sku: item.sku ?? '',
            provider: item.provider ?? '-',
            quantity: Number(item.quantity ?? 0),
            reason: item.reason ?? '',
            user: item.user ?? '',
          }))
        : [];
    } catch {
      this.allMovements = [];
    }

    const productsSet = new Set(this.allMovements.map((item) => item.product).filter(Boolean));
    const providersSet = new Set(this.allMovements.map((item) => item.provider).filter((p) => !!p && p !== '-'));

    try {
      const catalogProducts = JSON.parse(localStorage.getItem(PRODUCTS_KEY) ?? '[]') as Array<{ name?: string }>;
      catalogProducts.forEach((product) => {
        if (product?.name?.trim()) productsSet.add(product.name.trim());
      });
    } catch {}

    try {
      const catalogProviders = JSON.parse(localStorage.getItem(PROVIDERS_KEY) ?? '[]') as Array<{ businessName?: string; status?: string }>;
      catalogProviders.forEach((provider) => {
        if ((provider?.status ?? 'ACTIVO') === 'ACTIVO' && provider?.businessName?.trim()) {
          providersSet.add(provider.businessName.trim());
        }
      });
    } catch {}

    this.products = ['Todos', ...Array.from(productsSet).sort((a, b) => a.localeCompare(b))];
    this.providers = ['Todos', ...Array.from(providersSet).sort((a, b) => a.localeCompare(b))];
    this.filteredProducts = [...this.products];
  }

  onProductFilterInput(): void {
    const query = this.filterForm.controls.product.value.trim().toLowerCase();
    if (!query) {
      this.filteredProducts = [...this.products];
      this.showProductSuggestions = true;
      return;
    }
    this.filteredProducts = this.products.filter((item) => item.toLowerCase().includes(query));
    this.showProductSuggestions = this.filteredProducts.length > 0;
  }

  onProductFilterFocus(): void {
    this.filteredProducts = [...this.products];
    this.showProductSuggestions = this.filteredProducts.length > 0;
  }

  selectProductFilter(product: string): void {
    this.filterForm.patchValue({ product });
    this.showProductSuggestions = false;
  }
}
