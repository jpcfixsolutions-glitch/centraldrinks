import * as usuariosService from './usuarios.service.js';
import { verifyPassword } from './hash.js';
import { signToken } from './jwt.js';

export async function login(username, password) {
  const usuario = await usuariosService.buscarPorUsername(username);

  if (!usuario || !usuario.activo) {
    return null;
  }

  const ok = await verifyPassword(password, usuario.passwordHash);
  if (!ok) return null;

  const token = signToken({
    sub: usuario.id,
    username: usuario.username,
    rol: usuario.rol,
  });

  return {
    token,
    user: {
      id: usuario.id,
      username: usuario.username,
      nombre: usuario.nombre,
      rol: usuario.rol,
    },
  };
}

export async function me(userId) {
  const usuario = await usuariosService.buscarPorId(userId);
  if (!usuario) return null;
  return {
    id: usuario.id,
    username: usuario.username,
    nombre: usuario.nombre,
    rol: usuario.rol,
  };
}
