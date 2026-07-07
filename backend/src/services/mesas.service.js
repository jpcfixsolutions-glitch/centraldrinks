import { and, asc, eq } from 'drizzle-orm';
import { db } from './db.js';
import { mesas } from '../models/mesas.model.js';

export async function listar(sucursalId) {
  const where = sucursalId != null ? eq(mesas.sucursalId, sucursalId) : undefined;
  return db.select().from(mesas).where(where).orderBy(asc(mesas.numero));
}

export async function crear(sucursalId) {
  const todas = await listar(sucursalId);
  const proximoNumero = (todas[todas.length - 1]?.numero ?? 0) + 1;
  const [creada] = await db
    .insert(mesas)
    .values({ numero: proximoNumero, sucursalId: sucursalId ?? null })
    .returning();
  return creada;
}

export async function actualizar(id, data, sucursalId) {
  const where = sucursalId != null
    ? and(eq(mesas.id, id), eq(mesas.sucursalId, sucursalId))
    : eq(mesas.id, id);

  const [actualizada] = await db.update(mesas).set(data).where(where).returning();
  return actualizada ?? null;
}

export async function eliminar(id, sucursalId) {
  const where = sucursalId != null
    ? and(eq(mesas.id, id), eq(mesas.sucursalId, sucursalId))
    : eq(mesas.id, id);

  const [borrada] = await db.delete(mesas).where(where).returning();
  return !!borrada;
}
