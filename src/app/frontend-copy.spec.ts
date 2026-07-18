import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const appDir = dirname(fileURLToPath(import.meta.url));

const copyChecks = [
  {
    file: 'features/login/login.html',
    textos: [
      'recibir un codigo',
      'el codigo de 6 digitos',
      'nueva contrasena',
      '>Codigo<',
      'Enviar codigo',
      'Validar codigo',
    ],
  },
  {
    file: 'features/login/login.ts',
    textos: ['codigo de 6 digitos', 'Codigo validado', 'contrasena', 'Contrasena', 'sesion'],
  },
  {
    file: 'features/productos/productos.html',
    textos: ['Seleccionar categoria...', 'Seleccionar pais...'],
  },
  {
    file: 'features/productos/productos.ts',
    textos: [
      'Ingresa el nombre de la categoria.',
      'La categoria debe tener al menos 2 caracteres.',
      'La categoria no debe superar 80 caracteres.',
      'Ingresa una descripcion del producto.',
      'La descripcion debe tener al menos 3 caracteres.',
      'La descripcion no debe superar 2000 caracteres.',
      'Selecciona una categoria.',
      'Selecciona el pais de origen.',
    ],
  },
  {
    file: 'features/proveedores/proveedores.ts',
    textos: [
      'Consulta o ingresa la razon social.',
      'La razon social debe tener al menos 3 caracteres.',
      'La razon social no debe superar 120 caracteres.',
      'El RUC debe tener 11 digitos.',
      'El celular debe tener 9 digitos.',
      'El telefono debe tener 9 digitos.',
      'Ingresa un correo valido.',
      'Consulta o ingresa la direccion.',
      'La direccion debe tener al menos 5 caracteres.',
      'La direccion no debe superar 160 caracteres.',
    ],
  },
  {
    file: 'features/usuarios/usuarios.ts',
    textos: [
      'Ingresa un correo valido.',
      'Ingresa una contrasena.',
      'La contrasena debe tener al menos 8 caracteres.',
      'La contrasena no debe superar 120 caracteres.',
    ],
  },
  {
    file: 'features/inventario/inventario.ts',
    textos: [
      'Ingresa el stock minimo.',
      'El stock minimo no puede ser negativo.',
      'Ingresa la ubicacion del producto.',
      'La ubicacion debe tener al menos 2 caracteres.',
      'La ubicacion no debe superar 40 caracteres.',
    ],
  },
  {
    file: 'features/movimientos/movimientos.ts',
    textos: ['Esta accion revierte'],
  },
  {
    file: 'features/reportes/reportes.ts',
    textos: [
      'Stock despues',
      'Reporte de stock critico',
      'reporte stock critico',
      'Stock minimo',
      'Ubicacion',
      'Reporte de valorizacion',
      'reporte valorizacion',
      'Categoria',
    ],
  },
  {
    file: 'core/form-error.ts',
    textos: ['correo valido', 'longitud minima', 'longitud maxima', 'maximo permitido', 'no es valido'],
  },
  {
    file: 'core/paises.ts',
    textos: ['Peru', 'Canada', 'Espana', 'Japon', 'Mexico', 'Panama', 'Taiwan'],
  },
];

describe('copy visible del frontend', () => {
  it('usa tildes y eñe en los textos mostrados al usuario', () => {
    const pendientes = copyChecks.flatMap(({ file, textos }) => {
      const contenido = readFileSync(join(appDir, file), 'utf8');
      return textos
        .filter((texto) => contenido.includes(texto))
        .map((texto) => `${file}: ${texto}`);
    });

    expect(pendientes).toEqual([]);
  });
});
