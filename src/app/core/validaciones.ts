import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const soloDigitos = (longitud: number): ValidatorFn => {
  return (control: AbstractControl<string | null>): ValidationErrors | null => {
    const value = control.value ?? '';
    if (!value) return null;
    return new RegExp(`^\\d{${longitud}}$`).test(value) ? null : { soloDigitos: { longitud } };
  };
};

export const textoNormalizado = (min: number, max: number): ValidatorFn => {
  return (control: AbstractControl<string | null>): ValidationErrors | null => {
    const value = (control.value ?? '').trim().replace(/\s+/g, ' ');
    if (!value) return null;
    if (value.length < min || value.length > max) return { longitudTexto: { min, max } };
    return /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .,'-]+$/.test(value) ? null : { caracteresInvalidos: true };
  };
};
