import { eq } from 'drizzle-orm';
import { db } from './db.js';
import { usuarios } from '../models/usuarios.model.js';
import { hashPassword } from './hash.js';

export function toPublicUser(u) {
  return {
    id: u.id,
    username: u.username,
    nombre: u.nombre,
    rol: u.rol,
    activo: u.activo,
    createdAt: u.createdAt,
  };
}

export async function listar() {
  const todos = await db.select().from(usuarios);
  return todos.map(toPublicUser);
}

export async function buscarPorUsername(username) {
  return db.query.usuarios.findFirst({ where: eq(usuarios.username, username) });
}

export async function buscarPorId(id) {
  return db.query.usuarios.findFirst({ where: eq(usuarios.id, id) });
}

export async function crear({ username, password, nombre, rol }) {
  const passwordHash = await hashPassword(password);
  const [creado] = await db
    .insert(usuarios)
    .values({ username, passwordHash, nombre, rol })
    .returning();
  return toPublicUser(creado);
}

export async function actualizar(id, data) {
  const update = {};
  if (data.username) update.username = data.username;
  if (data.nombre) update.nombre = data.nombre;
  if (data.rol) update.rol = data.rol;
  if (data.password) update.passwordHash = await hashPassword(data.password);

  const [actualizado] = await db.update(usuarios).set(update).where(eq(usuarios.id, id)).returning();
  return actualizado ? toPublicUser(actualizado) : null;
}

export async function eliminar(id) {
  const [borrado] = await db.delete(usuarios).where(eq(usuarios.id, id)).returning();
  return !!borrado;
}
