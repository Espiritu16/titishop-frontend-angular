import '@angular/compiler';
import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { getApiErrorMessage } from './api-error';

describe('getApiErrorMessage', () => {
  it('combines backend message and details when ErrorResponse is returned', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        timestamp: '2026-06-02T21:45:00Z',
        status: 400,
        error: 'Bad Request',
        message: 'Error de validacion.',
        path: '/api/productos',
        details: ['nombre: no debe estar vacio', 'sku: no debe estar vacio'],
      },
    });

    expect(getApiErrorMessage(error)).toBe(
      'Error de validacion. nombre: no debe estar vacio sku: no debe estar vacio'
    );
  });

  it('uses a fallback for unknown errors', () => {
    expect(getApiErrorMessage(new Error('network failed'))).toBe('No se pudo completar la operación.');
  });
});
