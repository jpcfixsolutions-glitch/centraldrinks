const LOCALE = 'es-AR';

/**
 * SQLite/Turso guarda CURRENT_TIMESTAMP en UTC como "YYYY-MM-DD HH:MM:SS".
 * Sin normalizar, el navegador lo interpreta como hora local y desfasa el reloj.
 */
export function parseFechaDB(fecha) {
  if (!fecha) return new Date();
  if (fecha instanceof Date) return fecha;

  const valor = String(fecha).trim();
  if (!valor) return new Date();

  if (/[zZ]$/.test(valor) || /[+-]\d{2}:\d{2}$/.test(valor)) {
    return new Date(valor);
  }

  const normalizada = valor.includes('T') ? valor : valor.replace(' ', 'T');
  return new Date(`${normalizada}Z`);
}

export function formatearFechaHora(fecha, opciones = {}) {
  return parseFechaDB(fecha).toLocaleString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...opciones,
  });
}

/** Día/mes y hora (sin año), útil en listados compactos */
export function formatearFechaCorta(fecha, opciones = {}) {
  return parseFechaDB(fecha).toLocaleString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...opciones,
  });
}

export function formatearFecha(fecha, opciones = {}) {
  return parseFechaDB(fecha).toLocaleDateString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...opciones,
  });
}

export function formatearHora(fecha, opciones = {}) {
  return parseFechaDB(fecha).toLocaleTimeString(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    ...opciones,
  });
}

/** YYYY-MM-DD en hora local (para filtros por fecha) */
export function fechaLocalClave(fecha) {
  const d = parseFechaDB(fecha);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
