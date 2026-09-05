import { and, eq } from 'drizzle-orm';
import { db } from './db.js';
import { gastosFijos } from '../models/gastosFijos.model.js';
import { exigirSucursalId } from '../lib/sucursal.js';

export async function listar(sucursalId) {
  const sedeId = exigirSucursalId(sucursalId);
  return db.select().from(gastosFijos).where(eq(gastosFijos.sucursalId, sedeId));
}

export async function crear(data, sucursalId) {
  const sedeId = exigirSucursalId(sucursalId);
  const [nuevo] = await db
    .insert(gastosFijos)
    .values({ ...data, sucursalId: sedeId })
    .returning();
  return nuevo;
}

export async function actualizar(id, data, sucursalId) {
  const sedeId = exigirSucursalId(sucursalId);
  const where = and(eq(gastosFijos.id, id), eq(gastosFijos.sucursalId, sedeId));

  const [actualizado] = await db.update(gastosFijos).set(data).where(where).returning();
  return actualizado ?? null;
}

export async function eliminar(id, sucursalId) {
  const sedeId = exigirSucursalId(sucursalId);
  const where = and(eq(gastosFijos.id, id), eq(gastosFijos.sucursalId, sedeId));

  const [borrado] = await db.delete(gastosFijos).where(where).returning();
  return !!borrado;
}
