// Evita que una pestaña con el frontend anterior vuelva a escribir en la API
// consumos que conserva en memoria después de que otra terminal los eliminó.
export const MESA_SYNC_VERSION = '2';

export function requireMesaSyncVersion(req, res, next) {
  if (req.get('x-mesa-sync-version') !== MESA_SYNC_VERSION) {
    return res.status(409).json({
      error:
        'Esta terminal tiene una versión anterior de la aplicación. Recargala antes de modificar mesas.',
    });
  }

  next();
}
