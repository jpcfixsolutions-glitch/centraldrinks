import { and, eq } from 'drizzle-orm';
import { db } from './db.js';
import { mesaCuentas } from '../models/mesaCuentas.model.js';
import { mesas } from '../models/mesas.model.js';

function parseItems(itemsJson) {
  try {
    const parsed = JSON.parse(itemsJson || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toPublic(row) {
  return {
    id: row.id,
    sucursalId: row.sucursalId,
    numeroMesa: row.numeroMesa,
    nombreCliente: row.nombreCliente || '',
    items: parseItems(row.itemsJson),
    updatedAt: row.updatedAt,
  };
}

async function setEstadoMesa(sucursalId, numeroMesa, estado) {
  const condiciones = [eq(mesas.numero, numeroMesa)];
  if (sucursalId != null) condiciones.push(eq(mesas.sucursalId, sucursalId));

  await db.update(mesas).set({ estado }).where(and(...condiciones));
}

export async function listar(sucursalId) {
  const where = sucursalId != null ? eq(mesaCuentas.sucursalId, sucursalId) : undefined;
  const filas = await db.select().from(mesaCuentas).where(where);
  return filas.map(toPublic).filter((c) => c.items.length > 0);
}

export async function upsert(sucursalId, numeroMesa, { items, nombreCliente }) {
  const itemsArr = Array.isArray(items) ? items : [];
  const nombre = typeof nombreCliente === 'string' ? nombreCliente : '';

  // Si queda vacía, eliminar la cuenta
  if (itemsArr.length === 0) {
    return eliminar(sucursalId, numeroMesa);
  }

  const condiciones = [eq(mesaCuentas.numeroMesa, numeroMesa)];
  if (sucursalId != null) condiciones.push(eq(mesaCuentas.sucursalId, sucursalId));

  const [existente] = await db
    .select()
    .from(mesaCuentas)
    .where(and(...condiciones))
    .limit(1);

  const now = new Date().toISOString();
  const payload = {
    nombreCliente: nombre || null,
    itemsJson: JSON.stringify(itemsArr),
    updatedAt: now,
  };

  let fila;
  if (existente) {
    [fila] = await db
      .update(mesaCuentas)
      .set(payload)
      .where(eq(mesaCuentas.id, existente.id))
      .returning();
  } else {
    [fila] = await db
      .insert(mesaCuentas)
      .values({
        sucursalId: sucursalId ?? null,
        numeroMesa,
        ...payload,
      })
      .returning();
  }

  await setEstadoMesa(sucursalId, numeroMesa, 'ocupada');
  return toPublic(fila);
}

export async function eliminar(sucursalId, numeroMesa) {
  const condiciones = [eq(mesaCuentas.numeroMesa, numeroMesa)];
  if (sucursalId != null) condiciones.push(eq(mesaCuentas.sucursalId, sucursalId));

  const [borrada] = await db.delete(mesaCuentas).where(and(...condiciones)).returning();
  await setEstadoMesa(sucursalId, numeroMesa, 'libre');
  return borrada ? toPublic({ ...borrada, itemsJson: '[]' }) : { numeroMesa, items: [], nombreCliente: '' };
}
