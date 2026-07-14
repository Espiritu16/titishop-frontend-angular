import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Login', () => {
  it('permite mostrar u ocultar la contrasena al ingresar', () => {
    const template = readFileSync(join(__dirname, 'login.html'), 'utf8');

    expect(template).toContain('[type]="mostrarPassword ? \'text\' : \'password\'"');
    expect(template).toContain('(click)="togglePasswordVisibility()"');
    expect(template).toContain('[attr.aria-label]="mostrarPassword ? \'Ocultar contraseña\' : \'Mostrar contraseña\'"');
  });

  it('muestra el flujo de recuperacion de contrasena', () => {
    const template = readFileSync(join(__dirname, 'login.html'), 'utf8');

    expect(template).toContain('¿Olvidaste tu contraseña?');
    expect(template).toContain('(click)="iniciarRecuperacion()"');
    expect(template).toContain('recuperacionCodigo');
    expect(template).toContain('recuperacionNuevaPassword');
    expect(template).toContain('(ngSubmit)="submitRecuperacion()"');
  });
});
