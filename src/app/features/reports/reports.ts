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

  readonly filterForm;
  allMovements: ReportMovement[] = [];

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.nonNullable.group({
      fromDate: [''],
      toDate: [''],
      type: ['TODOS' as MovementType | 'TODOS'],
      provider: ['Todos'],
      product: ['Todos'],
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
      if (product !== 'Todos' && movement.product !== product) return false;
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
      product: 'Todos',
    });
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
    this.products = ['Todos', ...Array.from(productsSet).sort((a, b) => a.localeCompare(b))];
    this.providers = ['Todos', ...Array.from(providersSet).sort((a, b) => a.localeCompare(b))];
  }
}
