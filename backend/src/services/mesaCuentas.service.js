import { and, eq } from 'drizzle-orm';
import { db } from './db.js';
import { mesaCuentas } from '../models/mesaCuentas.model.js';
import { mesas } from '../models/mesas.model.js';
import { exigirSucursalId } from '../lib/sucursal.js';

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
  await db
    .update(mesas)
    .set({ estado })
    .where(and(eq(mesas.numero, numeroMesa), eq(mesas.sucursalId, sucursalId)));
}

export async function listar(sucursalId) {
  const sedeId = exigirSucursalId(sucursalId);
  const filas = await db
    .select({
      id: mesaCuentas.id,
      sucursalId: mesaCuentas.sucursalId,
      numeroMesa: mesaCuentas.numeroMesa,
      nombreCliente: mesaCuentas.nombreCliente,
      itemsJson: mesaCuentas.itemsJson,
      updatedAt: mesaCuentas.updatedAt,
    })
    .from(mesaCuentas)
    .innerJoin(
      mesas,
      and(
        eq(mesas.sucursalId, mesaCuentas.sucursalId),
        eq(mesas.numero, mesaCuentas.numeroMesa)
      )
    )
    .where(eq(mesaCuentas.sucursalId, sedeId));

  return filas.map(toPublic).filter((cuenta) => cuenta.items.length > 0);
}

export async function upsert(sucursalId, numeroMesa, { items, nombreCliente }) {
  const sedeId = exigirSucursalId(sucursalId);
  const itemsArr = Array.isArray(items) ? items : [];
  const nombre = typeof nombreCliente === 'string' ? nombreCliente : '';

  // Si queda vacía, eliminar la cuenta
  if (itemsArr.length === 0) {
    return eliminar(sedeId, numeroMesa);
  }

  const [mesa] = await db
    .select({ id: mesas.id })
    .from(mesas)
    .where(and(eq(mesas.sucursalId, sedeId), eq(mesas.numero, numeroMesa)))
    .limit(1);

  if (!mesa) {
    const error = new Error('La mesa no existe en esta sede');
    error.status = 404;
    throw error;
  }

  const now = new Date().toISOString();
  const payload = {
    nombreCliente: nombre || null,
    itemsJson: JSON.stringify(itemsArr),
    updatedAt: now,
  };

  const [fila] = await db
    .insert(mesaCuentas)
    .values({
      sucursalId: sedeId,
      numeroMesa,
      ...payload,
    })
    .onConflictDoUpdate({
      target: [mesaCuentas.sucursalId, mesaCuentas.numeroMesa],
      set: payload,
    })
    .returning();

  await setEstadoMesa(sedeId, numeroMesa, 'ocupada');
  return toPublic(fila);
}

export async function eliminar(sucursalId, numeroMesa) {
  const sedeId = exigirSucursalId(sucursalId);
  const condiciones = [
    eq(mesaCuentas.numeroMesa, numeroMesa),
    eq(mesaCuentas.sucursalId, sedeId),
  ];

  const [borrada] = await db.delete(mesaCuentas).where(and(...condiciones)).returning();
  await setEstadoMesa(sedeId, numeroMesa, 'libre');
  return borrada
    ? toPublic({ ...borrada, itemsJson: '[]' })
    : { numeroMesa, items: [], nombreCliente: '' };
}
