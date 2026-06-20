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

  it('preserves backend messages without details', () => {
    const error = new HttpErrorResponse({
      status: 401,
      error: {
        timestamp: '2026-06-20T16:00:00Z',
        status: 401,
        error: 'Unauthorized',
        message: 'Usuario o contrasena incorrectos.',
        path: '/api/auth/login',
        details: [],
      },
    });

    expect(getApiErrorMessage(error)).toBe('Usuario o contrasena incorrectos.');
  });

  it('preserves backend parameter validation details', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        timestamp: '2026-06-20T16:00:00Z',
        status: 400,
        error: 'Bad Request',
        message: 'Parametro de solicitud invalido.',
        path: '/api/productos',
        details: ['size: debe ser menor o igual que 100'],
      },
    });

    expect(getApiErrorMessage(error)).toBe(
      'Parametro de solicitud invalido. size: debe ser menor o igual que 100'
    );
  });
});
