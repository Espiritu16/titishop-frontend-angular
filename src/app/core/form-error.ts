import { AbstractControl } from '@angular/forms';

type MensajesCampo = Partial<Record<string, string>>;

const mensajesBase: Record<string, string> = {
  required: 'Este campo es obligatorio.',
  email: 'Ingresa un correo valido.',
  minlength: 'No cumple la longitud minima requerida.',
  maxlength: 'Supera la longitud maxima permitida.',
  min: 'El valor es menor al permitido.',
  max: 'El valor supera el maximo permitido.',
  pattern: 'El formato ingresado no es valido.',
};

export function debeMostrarError(control: AbstractControl | null | undefined, formularioEnviado = false): boolean {
  return !!control && control.invalid && (control.touched || control.dirty || formularioEnviado);
}

export function mensajeErrorCampo(
  control: AbstractControl | null | undefined,
  mensajes: MensajesCampo = {},
  formularioEnviado = false
): string {
  if (!debeMostrarError(control, formularioEnviado) || !control?.errors) return '';

  const [errorKey] = Object.keys(control.errors);
  return mensajes[errorKey] ?? mensajesBase[errorKey] ?? 'Revisa este campo antes de continuar.';
}
