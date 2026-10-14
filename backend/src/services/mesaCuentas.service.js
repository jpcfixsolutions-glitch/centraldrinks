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

async function setEstadoMesa(sucursalId, numeroMesa, estado, executor = db) {
  await executor
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

  const [existente] = await db
    .select({ itemsJson: mesaCuentas.itemsJson })
    .from(mesaCuentas)
    .where(and(eq(mesaCuentas.sucursalId, sedeId), eq(mesaCuentas.numeroMesa, numeroMesa)))
    .limit(1);

  // El estado operativo de los ítems enviados pertenece al backend. Un PUT
  // atrasado sólo puede editar/eliminar pendientes y agregar pendientes nuevos.
  const actuales = parseItems(existente?.itemsJson);
  const entrantesPorUid = new Map(itemsArr.filter((i) => i.uid).map((i) => [i.uid, i]));
  const protegidos = actuales.filter((i) => i.uid && i.estado && i.estado !== 'pendiente');
  const protegidosUids = new Set(protegidos.map((i) => i.uid));
  const itemsSeguros = [
    ...itemsArr.filter((i) => !i.uid || !protegidosUids.has(i.uid)),
    ...protegidos.map((actual) => {
      const entrante = entrantesPorUid.get(actual.uid);
      return entrante ? { ...entrante, ...actual } : actual;
    }),
  ];

  const now = new Date().toISOString();
  const payload = {
    nombreCliente: nombre || null,
    itemsJson: JSON.stringify(itemsSeguros),
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

export async function obtenerPorMesa(sucursalId, numeroMesa, executor = db) {
  const sedeId = exigirSucursalId(sucursalId);
  const [fila] = await executor
    .select()
    .from(mesaCuentas)
    .where(and(eq(mesaCuentas.numeroMesa, numeroMesa), eq(mesaCuentas.sucursalId, sedeId)))
    .limit(1);
  return fila ? toPublic(fila) : null;
}

const TRANSICIONES = {
  enviar: { desde: ['pendiente'], hacia: 'enviado' },
  recibir: { desde: ['enviado'], hacia: 'enviado' },
  listo: { desde: ['enviado'], hacia: 'listo' },
  entregar: { desde: ['listo'], hacia: 'entregado' },
  cancelar: { desde: ['enviado', 'listo'], hacia: 'cancelado' },
};

export async function transicionarItems(sucursalId, numeroMesa, { accion, uids, ronda }) {
  const sedeId = exigirSucursalId(sucursalId);
  return db.transaction(async (tx) => {
    const cuenta = await obtenerPorMesa(sedeId, numeroMesa, tx);
    if (!cuenta) {
      const error = new Error('La comanda no existe');
      error.status = 404;
      throw error;
    }

    const regla = TRANSICIONES[accion];
    const seleccionados = new Set(uids || []);
    const ahora = new Date().toISOString();
    let modificados = 0;
    const items = cuenta.items.map((item) => {
      const coincide = seleccionados.has(item.uid) || (ronda != null && item.ronda === ronda);
      if (!coincide) return item;
      if (!regla.desde.includes(item.estado)) {
        if (ronda != null && !seleccionados.has(item.uid)) return item;
        const error = new Error(`Transición inválida desde ${item.estado || 'sin estado'}`);
        error.status = 409;
        throw error;
      }
      modificados += 1;
      if (accion === 'recibir') return { ...item, recibidoCocina: true, fecha_recepcion: ahora };
      return {
        ...item,
        estado: regla.hacia,
        ...(accion === 'enviar' ? { ronda, fecha_envio: ahora } : {}),
        ...(accion === 'listo' ? { recibidoCocina: true, fecha_listo: ahora } : {}),
      };
    });

    if (modificados === 0) {
      const error = new Error('No se encontraron ítems para actualizar');
      error.status = 404;
      throw error;
    }

    const [actualizada] = await tx
      .update(mesaCuentas)
      .set({ itemsJson: JSON.stringify(items), updatedAt: ahora })
      .where(and(eq(mesaCuentas.numeroMesa, numeroMesa), eq(mesaCuentas.sucursalId, sedeId)))
      .returning();
    return toPublic(actualizada);
  });
}

export async function eliminar(sucursalId, numeroMesa, executor = db) {
  const sedeId = exigirSucursalId(sucursalId);
  const condiciones = [
    eq(mesaCuentas.numeroMesa, numeroMesa),
    eq(mesaCuentas.sucursalId, sedeId),
  ];

  const [borrada] = await executor.delete(mesaCuentas).where(and(...condiciones)).returning();
  await setEstadoMesa(sedeId, numeroMesa, 'libre', executor);
  return borrada
    ? toPublic({ ...borrada, itemsJson: '[]' })
    : { numeroMesa, items: [], nombreCliente: '' };
}
