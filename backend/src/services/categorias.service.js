import { eq } from 'drizzle-orm';
import { db } from './db.js';
import { categorias } from '../models/categorias.model.js';

export async function listar() {
  return db.select().from(categorias);
}

export async function crear(data) {
  const [creada] = await db.insert(categorias).values(data).returning();
  return creada;
}

export async function actualizar(id, data) {
  const [actualizada] = await db.update(categorias).set(data).where(eq(categorias.id, id)).returning();
  return actualizada ?? null;
}

export async function eliminar(id) {
  const [borrada] = await db.delete(categorias).where(eq(categorias.id, id)).returning();
  return !!borrada;
}
