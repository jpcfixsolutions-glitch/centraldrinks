import { eq } from 'drizzle-orm';
import { db } from './db.js';
import { gastosFijos } from '../models/gastosFijos.model.js';

export async function listar() {
  return db.select().from(gastosFijos);
}

export async function crear(data) {
  const [nuevo] = await db.insert(gastosFijos).values(data).returning();
  return nuevo;
}

export async function actualizar(id, data) {
  const [actualizado] = await db
    .update(gastosFijos)
    .set(data)
    .where(eq(gastosFijos.id, id))
    .returning();
  return actualizado ?? null;
}

export async function eliminar(id) {
  const [borrado] = await db.delete(gastosFijos).where(eq(gastosFijos.id, id)).returning();
  return !!borrado;
}
