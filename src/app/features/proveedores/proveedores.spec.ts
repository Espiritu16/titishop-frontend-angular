import '@angular/compiler';
import { FormBuilder } from '@angular/forms';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { ConfirmacionService } from '../../core/confirmacion.service';
import { NotificacionService } from '../../core/notificacion.service';
import { Proveedores } from './proveedores';
import { ProveedoresService } from './proveedores.service';

const paginaVacia = {
  content: [],
  page: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true,
  empty: true,
};

const crearComponente = (): Proveedores => new Proveedores(
  new FormBuilder(),
  { listar: () => of(paginaVacia) } as unknown as ProveedoresService,
  {} as ConfirmacionService,
  { error: () => undefined, success: () => undefined } as unknown as NotificacionService
);

describe('Proveedores', () => {
  it('muestra direccion como textarea para direcciones largas', () => {
    const template = readFileSync(join(__dirname, 'proveedores.html'), 'utf8');

    expect(template).toContain('<textarea');
    expect(template).toContain('formControlName="direccion"');
    expect(template).not.toContain('<input type="text" formControlName="direccion"');
  });

  it('requiere al menos celular, telefono o correo para guardar un proveedor', () => {
    const component = crearComponente();
    component.proveedorForm.setValue({
      razonSocial: 'Proveedor Demo',
      ruc: '20123456789',
      celular: '',
      telefono: '',
      email: '',
      direccion: 'Av. Demo 123',
    });

    expect(component.proveedorForm.valid).toBe(false);
    expect(component.proveedorForm.errors?.['contactoRequerido']).toBe(true);

    component.proveedorForm.patchValue({ email: 'ventas@demo.pe' });
    expect(component.proveedorForm.valid).toBe(true);

    component.proveedorForm.patchValue({ email: '', celular: '987654321' });
    expect(component.proveedorForm.valid).toBe(true);

    component.proveedorForm.patchValue({ celular: '', telefono: '012345678' });
    expect(component.proveedorForm.valid).toBe(true);
  });
});
