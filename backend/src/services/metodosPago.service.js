import { eq } from 'drizzle-orm';
import { db } from './db.js';
import { metodosPago } from '../models/metodosPago.model.js';

export async function listar() {
  return db.select().from(metodosPago);
}

export async function crear(data) {
  const [creado] = await db.insert(metodosPago).values(data).returning();
  return creado;
}

export async function actualizar(id, data) {
  const [actualizado] = await db.update(metodosPago).set(data).where(eq(metodosPago.id, id)).returning();
  return actualizado ?? null;
}

export async function eliminar(id) {
  const [borrado] = await db.delete(metodosPago).where(eq(metodosPago.id, id)).returning();
  return !!borrado;
}
