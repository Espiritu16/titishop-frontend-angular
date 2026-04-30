import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

type MovementType = 'ENTRADA' | 'SALIDA' | 'AJUSTE';

interface ReportMovement {
  id: string;
  date: string;
  type: MovementType;
  product: string;
  provider: string;
  quantity: number;
  user: string;
}

@Component({
  selector: 'app-reports',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export class Reports {
  readonly movementTypes: Array<MovementType | 'TODOS'> = ['TODOS', 'ENTRADA', 'SALIDA', 'AJUSTE'];
  readonly providers = ['Todos', 'Nova Import', 'Andes Supply', 'Global Tech'];
  readonly products = ['Todos', 'Mouse inalámbrico', 'Cable USB-C 2m', 'Lámpara LED escritorio', 'Memoria USB 64GB'];

  readonly filterForm;

  readonly allMovements: ReportMovement[] = [
    { id: 'm1', date: '2026-04-27T09:20:00', type: 'ENTRADA', product: 'Mouse inalámbrico', provider: 'Nova Import', quantity: 25, user: 'María Soto' },
    { id: 'm2', date: '2026-04-27T11:10:00', type: 'SALIDA', product: 'Memoria USB 64GB', provider: 'Global Tech', quantity: 10, user: 'Luis Peña' },
    { id: 'm3', date: '2026-04-28T08:42:00', type: 'ENTRADA', product: 'Cable USB-C 2m', provider: 'Andes Supply', quantity: 40, user: 'Ana Ruiz' },
    { id: 'm4', date: '2026-04-28T14:35:00', type: 'AJUSTE', product: 'Lámpara LED escritorio', provider: 'Nova Import', quantity: 3, user: 'María Soto' },
    { id: 'm5', date: '2026-04-29T10:03:00', type: 'SALIDA', product: 'Mouse inalámbrico', provider: 'Nova Import', quantity: 6, user: 'Luis Peña' },
  ];

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.nonNullable.group({
      fromDate: [''],
      toDate: [''],
      type: ['TODOS' as MovementType | 'TODOS'],
      provider: ['Todos'],
      product: ['Todos'],
    });
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
}
