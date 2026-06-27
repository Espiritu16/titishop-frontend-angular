import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorResponse } from './models';

export const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof HttpErrorResponse && isApiErrorResponse(error.error)) {
    const details = error.error.details.length ? ` ${error.error.details.join(' ')}` : '';
    return `${error.error.message}${details}`.trim();
  }

  if (error instanceof HttpErrorResponse) {
    return getHttpFallbackMessage(error.status);
  }

  return 'No se pudo completar la operación.';
};

const isApiErrorResponse = (value: unknown): value is ApiErrorResponse => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ApiErrorResponse>;
  return typeof candidate.message === 'string' && Array.isArray(candidate.details);
};

const getHttpFallbackMessage = (status: number): string => {
  switch (status) {
    case 0:
      return 'No se pudo conectar con el servidor.';
    case 401:
      return 'Debes iniciar sesión para continuar.';
    case 403:
      return 'No tienes permisos para realizar esta acción.';
    case 404:
      return 'No se encontró el recurso solicitado.';
    case 413:
      return 'El archivo supera el tamaño máximo permitido.';
    default:
      return 'No se pudo completar la operación.';
  }
};
