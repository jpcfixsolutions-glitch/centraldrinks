import { and, eq, ne } from 'drizzle-orm';
import { db } from './db.js';
import { usuarios } from '../models/usuarios.model.js';
import { hashPassword } from './hash.js';
import { exigirSucursalId } from '../lib/sucursal.js';

export function toPublicUser(u) {
  return {
    id: u.id,
    username: u.username,
    nombre: u.nombre,
    rol: u.rol,
    activo: u.activo,
    sucursalId: u.sucursalId ?? null,
    createdAt: u.createdAt,
  };
}

export async function listar(sucursalId) {
  const sedeId = exigirSucursalId(sucursalId);
  // El rol 'creador' nunca aparece en el panel de administración
  const where = and(eq(usuarios.sucursalId, sedeId), ne(usuarios.rol, 'creador'));
  const todos = await db.select().from(usuarios).where(where);
  return todos.map(toPublicUser);
}

export async function buscarPorUsername(username) {
  return db.query.usuarios.findFirst({ where: eq(usuarios.username, username) });
}

export async function buscarPorId(id) {
  return db.query.usuarios.findFirst({ where: eq(usuarios.id, id) });
}

export async function crear({ username, password, nombre, rol }, sucursalId) {
  const sedeId = exigirSucursalId(sucursalId);
  const passwordHash = await hashPassword(password);
  const [creado] = await db
    .insert(usuarios)
    .values({ username, passwordHash, nombre, rol, sucursalId: sedeId })
    .returning();
  return toPublicUser(creado);
}

export async function actualizar(id, data, sucursalId) {
  const sedeId = exigirSucursalId(sucursalId);
  const update = {};
  if (data.username) update.username = data.username;
  if (data.nombre) update.nombre = data.nombre;
  if (data.rol) update.rol = data.rol;
  if (data.password) update.passwordHash = await hashPassword(data.password);

  const where = and(eq(usuarios.id, id), eq(usuarios.sucursalId, sedeId));

  const [actualizado] = await db.update(usuarios).set(update).where(where).returning();
  return actualizado ? toPublicUser(actualizado) : null;
}

export async function eliminar(id, sucursalId) {
  const sedeId = exigirSucursalId(sucursalId);
  const where = and(eq(usuarios.id, id), eq(usuarios.sucursalId, sedeId));

  const [borrado] = await db.delete(usuarios).where(where).returning();
  return !!borrado;
}
