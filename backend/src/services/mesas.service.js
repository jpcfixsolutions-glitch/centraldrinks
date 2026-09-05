import { and, asc, eq } from 'drizzle-orm';
import { db } from './db.js';
import { mesas } from '../models/mesas.model.js';
import { mesaCuentas } from '../models/mesaCuentas.model.js';
import { exigirSucursalId } from '../lib/sucursal.js';

export async function listar(sucursalId) {
  const sedeId = exigirSucursalId(sucursalId);
  return db
    .select()
    .from(mesas)
    .where(eq(mesas.sucursalId, sedeId))
    .orderBy(asc(mesas.numero));
}

export async function crear(sucursalId) {
  const sedeId = exigirSucursalId(sucursalId);
  const todas = await listar(sedeId);
  const proximoNumero = (todas[todas.length - 1]?.numero ?? 0) + 1;
  const [creada] = await db
    .insert(mesas)
    .values({ numero: proximoNumero, sucursalId: sedeId })
    .returning();
  return creada;
}

export async function actualizar(id, data, sucursalId) {
  const sedeId = exigirSucursalId(sucursalId);
  const where = and(eq(mesas.id, id), eq(mesas.sucursalId, sedeId));

  const [actualizada] = await db.update(mesas).set(data).where(where).returning();
  return actualizada ?? null;
}

export async function eliminar(id, sucursalId) {
  const sedeId = exigirSucursalId(sucursalId);
  const where = and(eq(mesas.id, id), eq(mesas.sucursalId, sedeId));

  const [mesa] = await db.select().from(mesas).where(where).limit(1);
  if (!mesa) return false;

  const [cuentaAbierta] = await db
    .select({ id: mesaCuentas.id })
    .from(mesaCuentas)
    .where(
      and(
        eq(mesaCuentas.sucursalId, sedeId),
        eq(mesaCuentas.numeroMesa, mesa.numero)
      )
    )
    .limit(1);

  if (cuentaAbierta) {
    const error = new Error('No se puede eliminar una mesa que tiene una cuenta abierta');
    error.status = 409;
    throw error;
  }

  const [borrada] = await db.delete(mesas).where(where).returning();
  return !!borrada;
}
