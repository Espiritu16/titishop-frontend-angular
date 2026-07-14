import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Inventario', () => {
  it('usa estilos de selector de producto en el modal de registro', () => {
    const styles = readFileSync(join(__dirname, 'inventario.scss'), 'utf8');

    expect(styles).toContain('.producto-selector__control');
    expect(styles).toContain('.producto-selector__menu');
    expect(styles).toContain('.producto-selector__option--selected');
  });
});
