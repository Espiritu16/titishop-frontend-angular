const API_LOCAL_URL = 'http://localhost:8080/api';
const API_PRODUCCION_URL = 'https://api-titishop.proyectoutp.com/api';

const esHostLocal = (): boolean => {
  if (typeof globalThis.location === 'undefined') return false;
  return ['localhost', '127.0.0.1'].includes(globalThis.location.hostname);
};

export const API_BASE_URL = esHostLocal() ? API_LOCAL_URL : API_PRODUCCION_URL;
export const API_ORIGIN_URL = API_BASE_URL.replace(/\/api\/?$/, '');
export const SWAGGER_URL = `${API_ORIGIN_URL}/swagger`;

export const apiUrl = (path: string): string => {
  const trimmedPath = path.startsWith('/') ? path.slice(1) : path;
  const withoutApiPrefix = trimmedPath === 'api' ? '' : trimmedPath.replace(/^api\//, '');
  const normalizedPath = withoutApiPrefix.startsWith('/') ? withoutApiPrefix : `/${withoutApiPrefix}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
