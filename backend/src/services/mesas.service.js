import { asc, eq } from 'drizzle-orm';
import { db } from './db.js';
import { mesas } from '../models/mesas.model.js';

export async function listar() {
  return db.select().from(mesas).orderBy(asc(mesas.numero));
}

export async function crear() {
  const todas = await listar();
  const proximoNumero = (todas[todas.length - 1]?.numero ?? 0) + 1;
  const [creada] = await db.insert(mesas).values({ numero: proximoNumero }).returning();
  return creada;
}

export async function actualizar(id, data) {
  const [actualizada] = await db.update(mesas).set(data).where(eq(mesas.id, id)).returning();
  return actualizada ?? null;
}

export async function eliminar(id) {
  const [borrada] = await db.delete(mesas).where(eq(mesas.id, id)).returning();
  return !!borrada;
}
