import { describe, expect, it } from 'vitest';
import { API_BASE_URL, apiUrl } from './api.config';

describe('apiUrl', () => {
  it('uses local or production backend according to the current host', () => {
    expect(API_BASE_URL).toMatch(/^http:\/\/localhost:8080\/api$|^https:\/\/api-titishop\.proyectoutp\.com\/api$/);
  });

  it('does not duplicate the api prefix', () => {
    expect(apiUrl('/productos')).toBe(`${API_BASE_URL}/productos`);
    expect(apiUrl('/api/productos')).toBe(`${API_BASE_URL}/productos`);
  });
});
