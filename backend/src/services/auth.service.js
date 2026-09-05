import { eq, sql } from 'drizzle-orm';
import { db } from './db.js';
import { sucursales } from '../models/sucursales.model.js';
import { usuarios } from '../models/usuarios.model.js';
import * as usuariosService from './usuarios.service.js';
import { obtener as obtenerSuscripcion } from './suscripcion.service.js';
import { verifyPassword } from './hash.js';
import { signToken } from './jwt.js';
import { exigirSucursalId } from '../lib/sucursal.js';

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

async function asegurarSedeUsuarioOperativo(usuario) {
  if (usuario.rol === 'creador') return usuario;

  // Una sede ya válida siempre gana. El dominio solo sirve para recuperar
  // usuarios sin sede; nunca debe poder moverlos entre sedes.
  const sucursalActual = await obtenerSucursal(usuario.sucursalId);
  if (sucursalActual) return usuario;

  const separador = usuario.username.lastIndexOf('@');
  const dominio = separador >= 0 ? usuario.username.slice(separador + 1).trim() : '';
  const sucursalPorDominio = dominio
      ? await db.query.sucursales.findFirst({
        where: sql`lower(${sucursales.dominio}) = ${dominio.toLowerCase()}`,
      })
    : null;

  if (sucursalPorDominio) {
    const [corregido] = await db
      .update(usuarios)
      .set({ sucursalId: sucursalPorDominio.id })
      .where(eq(usuarios.id, usuario.id))
      .returning();
    return corregido;
  }

  exigirSucursalId(usuario.sucursalId);
  return usuario;
}

export async function login(username, password) {
  const usuario = await usuariosService.buscarPorUsername(username);

  if (!usuario || !usuario.activo) {
    return null;
  }

  const ok = await verifyPassword(password, usuario.passwordHash);
  if (!ok) return null;

  const usuarioConSede = await asegurarSedeUsuarioOperativo(usuario);

  const sucursal = await obtenerSucursal(usuarioConSede.sucursalId);
  const estadoSuscripcion = await obtenerEstadoSuscripcion();

  const token = signToken({
    sub: usuarioConSede.id,
    username: usuarioConSede.username,
    rol: usuarioConSede.rol,
    sucursalId: usuarioConSede.sucursalId ?? null,
    sucursalNombre: sucursal?.nombre ?? null,
  });

  return {
    token,
    user: buildUserPayload(usuarioConSede, sucursal, estadoSuscripcion),
  };
}

export async function me(userId) {
  const usuario = await usuariosService.buscarPorId(userId);
  if (!usuario) return null;
  const usuarioConSede = await asegurarSedeUsuarioOperativo(usuario);
  const sucursal = await obtenerSucursal(usuarioConSede.sucursalId);
  const estadoSuscripcion = await obtenerEstadoSuscripcion();
  return buildUserPayload(usuarioConSede, sucursal, estadoSuscripcion);
}
