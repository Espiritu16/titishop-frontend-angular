import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorResponse } from './models';

export const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof HttpErrorResponse && isApiErrorResponse(error.error)) {
    const details = error.error.details.length ? ` ${error.error.details.join(' ')}` : '';
    return `${error.error.message}${details}`.trim();
  }

  return 'No se pudo completar la operación.';
};

const isApiErrorResponse = (value: unknown): value is ApiErrorResponse => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ApiErrorResponse>;
  return typeof candidate.message === 'string' && Array.isArray(candidate.details);
};
