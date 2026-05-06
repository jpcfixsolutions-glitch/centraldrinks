const API_URL = import.meta.env.VITE_API_URL ?? '/api';

const TOKEN_KEY = 'centraldrinks_token';

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
    const message =
      data && typeof data === 'object' && typeof data.error === 'string'
        ? data.error
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
  listar: () => apiFetch('/cajas'),
  obtener: (id) => apiFetch(`/cajas/${id}`),
  cerrar: () => apiFetch('/cajas/cerrar', { method: 'POST', body: {} }),
};
