/**
 * Persistencia local de cuentas abiertas de mesas por sucursal.
 * Sobrevive a logout/cambio de usuario en el mismo navegador/terminal.
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
    // Limpiar mesas sin ítems para no acumular basura
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
    // quota / modo privado: no bloquear la UI
  }
}
