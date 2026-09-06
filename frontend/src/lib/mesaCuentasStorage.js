/** Utilidades para convertir cuentas y retirar el caché legado. */

const PREFIX = 'club22_mesa_cuentas';

function storageKey(sucursalId) {
  const id = sucursalId ?? 'default';
  return `${PREFIX}_${id}`;
}

/**
 * El caché histórico no puede ser fuente de verdad: podía reconstruir cuentas
 * ya eliminadas. Esta función purga instalaciones que todavía tengan datos de
 * versiones anteriores.
 */
export function eliminarCuentasMesasLocales(sucursalId) {
  try {
    localStorage.removeItem(storageKey(sucursalId));
    localStorage.removeItem(storageKey(null));
  } catch {
    // ignore
  }
}

/** Convierte respuesta del API a maps del frontend */
export function cuentasApiAMaps(cuentas) {
  const cargaMesas = {};
  const nombresMesas = {};
  for (const c of cuentas || []) {
    const n = Number(c.numeroMesa);
    if (!Number.isFinite(n)) continue;
    if (Array.isArray(c.items) && c.items.length > 0) {
      cargaMesas[n] = c.items;
      if (c.nombreCliente) nombresMesas[n] = c.nombreCliente;
    }
  }
  return { cargaMesas, nombresMesas };
}
