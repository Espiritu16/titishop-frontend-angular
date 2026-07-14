import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Usuarios', () => {
  it('permite mostrar u ocultar la contrasena al crear o cambiar usuario', () => {
    const template = readFileSync(join(__dirname, 'usuarios.html'), 'utf8');

    expect(template).toContain('[type]="mostrarPassword ? \'text\' : \'password\'"');
    expect(template).toContain('(click)="togglePasswordVisibility()"');
    expect(template).toContain('[attr.aria-label]="mostrarPassword ? \'Ocultar contraseña\' : \'Mostrar contraseña\'"');
  });
});
