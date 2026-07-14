import '@angular/compiler';
import { FormBuilder } from '@angular/forms';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { ConfirmacionService } from '../../core/confirmacion.service';
import { NotificacionService } from '../../core/notificacion.service';
import { CategoriasService } from './categorias.service';
import { MarcasService } from './marcas.service';
import { Productos } from './productos';
import { ProductosService } from './productos.service';
import { ProveedoresService } from '../proveedores/proveedores.service';

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

describe('Productos', () => {
  it('no muestra ni registra una URL manual de imagen en el formulario de producto', () => {
    const component = new Productos(
      new FormBuilder(),
      { listar: () => of(paginaVacia) } as unknown as ProductosService,
      { listar: () => of(paginaVacia) } as unknown as CategoriasService,
      { listar: () => of(paginaVacia) } as unknown as MarcasService,
      { listar: () => of(paginaVacia) } as unknown as ProveedoresService,
      {} as never,
      {} as ConfirmacionService,
      { error: () => undefined } as unknown as NotificacionService
    );
    const template = readFileSync(join(__dirname, 'productos.html'), 'utf8');

    expect(component.productoForm.contains('imagenUrl')).toBe(false);
    expect(template).not.toContain('URL de la imagen');
    expect(template).not.toContain('formControlName="imagenUrl"');
  });
});
