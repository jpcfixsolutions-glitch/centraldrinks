import { verifyToken } from '../services/jwt.js';
import * as usuariosService from '../services/usuarios.service.js';
import { exigirSucursalId } from '../lib/sucursal.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  const token = header.slice(7);
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  // La sede y el rol del JWT pueden quedar obsoletos si el usuario fue corregido
  // mientras tenía una sesión abierta. La base es la fuente de verdad en cada request.
  Promise.resolve(usuariosService.buscarPorId(payload.sub))
    .then((usuario) => {
      if (!usuario || !usuario.activo) {
        return res.status(401).json({ error: 'Usuario inexistente o inactivo' });
      }

      req.user = {
        ...payload,
        sub: usuario.id,
        username: usuario.username,
        rol: usuario.rol,
        sucursalId: usuario.sucursalId ?? null,
      };
      next();
    })
    .catch(next);
}

export function requireSucursal(req, res, next) {
  try {
    req.user.sucursalId = exigirSucursalId(req.user?.sucursalId);
    next();
  } catch (error) {
    return res.status(error.status ?? 403).json({ error: error.message });
  }
}

export function requireRole(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tenés permisos para esta acción' });
    }
    next();
  };
}
