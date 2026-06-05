import '@angular/compiler';
import { FormControl } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { soloDigitos, textoNormalizado } from './validaciones';

describe('validaciones compartidas', () => {
  it('acepta un campo opcional vacio con validador de digitos', () => {
    const control = new FormControl('');

    expect(soloDigitos(11)(control)).toBeNull();
  });

  it('rechaza valores que no tienen la longitud exacta de digitos', () => {
    const control = new FormControl('123');

    expect(soloDigitos(11)(control)).toEqual({ soloDigitos: { longitud: 11 } });
  });

  it('rechaza texto con caracteres fuera del catalogo permitido', () => {
    const control = new FormControl('Categoria @@@');

    expect(textoNormalizado(2, 80)(control)).toEqual({ caracteresInvalidos: true });
  });
});
