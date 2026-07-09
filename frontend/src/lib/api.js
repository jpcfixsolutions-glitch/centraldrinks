const configuredUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '');
const API_URL = configuredUrl ?? (import.meta.env.DEV ? '/api' : '');

const TOKEN_KEY = 'centraldrinks_token';
export const AUTH_EXPIRED_EVENT = 'centraldrinks:auth-expired';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch(path, options = {}) {
  if (!API_URL) {
    throw new ApiError(
      'VITE_API_URL no está configurada. Agregala en Vercel (proyecto frontend).',
      0
    );
  }

  const { body, auth = true, headers, ...rest } = options;

  const finalHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (auth) {
    const token = getToken();
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && auth && getToken()) {
      setToken(null);
      window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
    }

    const message =
      data && typeof data === 'object' && typeof data.error === 'string'
        ? data.error
        : response.status === 404
          ? `Ruta no encontrada (${API_URL}${path}). Revisá VITE_API_URL y el deploy del backend.`
          : `Error ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return data;
}

export const categoriasApi = {
  listar: () => apiFetch('/categorias'),
  crear: (nombre) => apiFetch('/categorias', { method: 'POST', body: { nombre } }),
  actualizar: (id, nombre) => apiFetch(`/categorias/${id}`, { method: 'PUT', body: { nombre } }),
  eliminar: (id) => apiFetch(`/categorias/${id}`, { method: 'DELETE' }),
};

export const metodosPagoApi = {
  listar: () => apiFetch('/metodos-pago'),
  crear: (data) => apiFetch('/metodos-pago', { method: 'POST', body: data }),
  actualizar: (id, data) => apiFetch(`/metodos-pago/${id}`, { method: 'PUT', body: data }),
  eliminar: (id) => apiFetch(`/metodos-pago/${id}`, { method: 'DELETE' }),
};

export const productosApi = {
  listar: () => apiFetch('/productos'),
  crear: (data) => apiFetch('/productos', { method: 'POST', body: data }),
  actualizar: (id, data) => apiFetch(`/productos/${id}`, { method: 'PUT', body: data }),
  eliminar: (id) => apiFetch(`/productos/${id}`, { method: 'DELETE' }),
};

export const mesasApi = {
  listar: () => apiFetch('/mesas'),
  crear: () => apiFetch('/mesas', { method: 'POST', body: {} }),
  actualizar: (id, data) => apiFetch(`/mesas/${id}`, { method: 'PUT', body: data }),
  eliminar: (id) => apiFetch(`/mesas/${id}`, { method: 'DELETE' }),
};

export const ventasApi = {
  listar: () => apiFetch('/ventas'),
  obtener: (id) => apiFetch(`/ventas/${id}`),
  crear: (data) => apiFetch('/ventas', { method: 'POST', body: data }),
};

export const cajasApi = {
  actual: () => apiFetch('/cajas/actual'),
  abrir: (efectivoInicial) => apiFetch('/cajas/abrir', { method: 'POST', body: { efectivoInicial } }),
  listar: () => apiFetch('/cajas'),
  obtener: (id) => apiFetch(`/cajas/${id}`),
  cerrar: () => apiFetch('/cajas/cerrar', { method: 'POST', body: {} }),
};

export const gastosFijosApi = {
  listar: () => apiFetch('/gastos-fijos'),
  crear: (data) => apiFetch('/gastos-fijos', { method: 'POST', body: data }),
  actualizar: (id, data) => apiFetch(`/gastos-fijos/${id}`, { method: 'PUT', body: data }),
  eliminar: (id) => apiFetch(`/gastos-fijos/${id}`, { method: 'DELETE' }),
};

export const gastosApi = {
  listar: () => apiFetch('/gastos'),
  crear: (data) => apiFetch('/gastos', { method: 'POST', body: data }),
  eliminar: (id) => apiFetch(`/gastos/${id}`, { method: 'DELETE' }),
};

export const botellasBarraApi = {
  listar: () => apiFetch('/botellas-barra'),
  crear: (data) => apiFetch('/botellas-barra', { method: 'POST', body: data }),
  eliminar: (id) => apiFetch(`/botellas-barra/${id}`, { method: 'DELETE' }),
};

export const auditLogsApi = {
  listar: () => apiFetch('/audit-logs'),
  crear: (data) => apiFetch('/audit-logs', { method: 'POST', body: data }),
};

export const suscripcionApi = {
  obtener: () => apiFetch('/suscripcion'),
  actualizar: (diaVencimiento) =>
    apiFetch('/suscripcion', { method: 'PUT', body: { diaVencimiento } }),
  reactivar: () =>
    apiFetch('/suscripcion/reactivar', { method: 'POST' }),
};
