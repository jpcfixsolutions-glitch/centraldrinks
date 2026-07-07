import { eq } from 'drizzle-orm';
import { db } from './db.js';
import { sucursales } from '../models/sucursales.model.js';
import * as usuariosService from './usuarios.service.js';
import { verifyPassword } from './hash.js';
import { signToken } from './jwt.js';

async function obtenerSucursal(sucursalId) {
  if (!sucursalId) return null;
  return db.query.sucursales.findFirst({ where: eq(sucursales.id, sucursalId) });
}

function buildUserPayload(usuario, sucursal) {
  return {
    id: usuario.id,
    username: usuario.username,
    nombre: usuario.nombre,
    rol: usuario.rol,
    sucursalId: usuario.sucursalId ?? null,
    sucursalNombre: sucursal?.nombre ?? null,
  };
}

export async function login(username, password) {
  const usuario = await usuariosService.buscarPorUsername(username);

  if (!usuario || !usuario.activo) {
    return null;
  }

  const ok = await verifyPassword(password, usuario.passwordHash);
  if (!ok) return null;

  const sucursal = await obtenerSucursal(usuario.sucursalId);

  const token = signToken({
    sub: usuario.id,
    username: usuario.username,
    rol: usuario.rol,
    sucursalId: usuario.sucursalId ?? null,
    sucursalNombre: sucursal?.nombre ?? null,
  });

  return {
    token,
    user: buildUserPayload(usuario, sucursal),
  };
}

export async function me(userId) {
  const usuario = await usuariosService.buscarPorId(userId);
  if (!usuario) return null;
  const sucursal = await obtenerSucursal(usuario.sucursalId);
  return buildUserPayload(usuario, sucursal);
}
