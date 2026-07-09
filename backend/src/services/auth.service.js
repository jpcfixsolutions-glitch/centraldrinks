import { eq } from 'drizzle-orm';
import { db } from './db.js';
import { sucursales } from '../models/sucursales.model.js';
import * as usuariosService from './usuarios.service.js';
import { obtener as obtenerSuscripcion } from './suscripcion.service.js';
import { verifyPassword } from './hash.js';
import { signToken } from './jwt.js';

async function obtenerSucursal(sucursalId) {
  if (!sucursalId) return null;
  return db.query.sucursales.findFirst({ where: eq(sucursales.id, sucursalId) });
}

async function obtenerEstadoSuscripcion() {
  // Suscripción global única — no ligada a una sucursal
  return obtenerSuscripcion();
}

function buildUserPayload(usuario, sucursal, estadoSuscripcion) {
  return {
    id: usuario.id,
    username: usuario.username,
    nombre: usuario.nombre,
    rol: usuario.rol,
    sucursalId: usuario.sucursalId ?? null,
    sucursalNombre: sucursal?.nombre ?? null,
    suscripcion: estadoSuscripcion ?? null,
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
  const estadoSuscripcion = await obtenerEstadoSuscripcion();

  const token = signToken({
    sub: usuario.id,
    username: usuario.username,
    rol: usuario.rol,
    sucursalId: usuario.sucursalId ?? null,
    sucursalNombre: sucursal?.nombre ?? null,
  });

  return {
    token,
    user: buildUserPayload(usuario, sucursal, estadoSuscripcion),
  };
}

export async function me(userId) {
  const usuario = await usuariosService.buscarPorId(userId);
  if (!usuario) return null;
  const sucursal = await obtenerSucursal(usuario.sucursalId);
  const estadoSuscripcion = await obtenerEstadoSuscripcion();
  return buildUserPayload(usuario, sucursal, estadoSuscripcion);
}
