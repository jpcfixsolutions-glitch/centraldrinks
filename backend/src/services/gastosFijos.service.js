import { and, eq } from 'drizzle-orm';
import { db } from './db.js';
import { gastosFijos } from '../models/gastosFijos.model.js';

export async function listar(sucursalId) {
  const where = sucursalId != null ? eq(gastosFijos.sucursalId, sucursalId) : undefined;
  return db.select().from(gastosFijos).where(where);
}

export async function crear(data, sucursalId) {
  const [nuevo] = await db
    .insert(gastosFijos)
    .values({ ...data, sucursalId: sucursalId ?? null })
    .returning();
  return nuevo;
}

export async function actualizar(id, data, sucursalId) {
  const where = sucursalId != null
    ? and(eq(gastosFijos.id, id), eq(gastosFijos.sucursalId, sucursalId))
    : eq(gastosFijos.id, id);

  const [actualizado] = await db.update(gastosFijos).set(data).where(where).returning();
  return actualizado ?? null;
}

export async function eliminar(id, sucursalId) {
  const where = sucursalId != null
    ? and(eq(gastosFijos.id, id), eq(gastosFijos.sucursalId, sucursalId))
    : eq(gastosFijos.id, id);

  const [borrado] = await db.delete(gastosFijos).where(where).returning();
  return !!borrado;
}
