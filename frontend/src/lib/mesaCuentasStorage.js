/**
 * Caché local de cuentas abiertas (fallback / migración).
 * La fuente de verdad es el backend (/mesa-cuentas).
 */

const PREFIX = 'club22_mesa_cuentas';

function storageKey(sucursalId) {
  const id = sucursalId ?? 'default';
  return `${PREFIX}_${id}`;
}

export function cargarCuentasMesas(sucursalId) {
  try {
    const raw = localStorage.getItem(storageKey(sucursalId));
    if (!raw) return { cargaMesas: {}, nombresMesas: {} };

    const parsed = JSON.parse(raw);
    return {
      cargaMesas: parsed?.cargaMesas && typeof parsed.cargaMesas === 'object' ? parsed.cargaMesas : {},
      nombresMesas:
        parsed?.nombresMesas && typeof parsed.nombresMesas === 'object' ? parsed.nombresMesas : {},
    };
  } catch {
    return { cargaMesas: {}, nombresMesas: {} };
  }
}

export function guardarCuentasMesas(sucursalId, cargaMesas, nombresMesas) {
  try {
    const cargaLimpia = {};
    for (const [numero, items] of Object.entries(cargaMesas || {})) {
      if (Array.isArray(items) && items.length > 0) {
        cargaLimpia[numero] = items;
      }
    }

    const nombresLimpios = {};
    for (const [numero, nombre] of Object.entries(nombresMesas || {})) {
      if (nombre && (cargaLimpia[numero] || cargaLimpia[String(numero)])) {
        nombresLimpios[numero] = nombre;
      }
    }

    localStorage.setItem(
      storageKey(sucursalId),
      JSON.stringify({ cargaMesas: cargaLimpia, nombresMesas: nombresLimpios })
    );
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
