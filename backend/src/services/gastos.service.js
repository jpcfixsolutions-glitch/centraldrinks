import { and, desc, eq } from 'drizzle-orm';
import { db } from './db.js';
import { gastos } from '../models/gastos.model.js';
import { exigirSucursalId } from '../lib/sucursal.js';

function toPublic(g) {
  return {
    id: g.id,
    asunto: g.asunto,
    monto: g.monto,
    metodo: g.metodoPago,
    metodoPago: g.metodoPago,
    fecha: g.fecha,
  };
}

export async function listar(sucursalId) {
  const sedeId = exigirSucursalId(sucursalId);
  const lista = await db
    .select()
    .from(gastos)
    .where(eq(gastos.sucursalId, sedeId))
    .orderBy(desc(gastos.fecha));
  return lista.map(toPublic);
}

export async function crear(data, usuarioId, sucursalId) {
  const sedeId = exigirSucursalId(sucursalId);
  const values = {
    asunto: data.asunto,
    monto: data.monto,
    metodoPago: data.metodoPago ?? data.metodo,
    usuarioId: usuarioId ?? null,
    sucursalId: sedeId,
  };
  // Si no viene fecha, la DB aplica CURRENT_TIMESTAMP (comportamiento actual)
  if (data.fecha) values.fecha = data.fecha;

  const [creado] = await db.insert(gastos).values(values).returning();
  return toPublic(creado);
}

export async function eliminar(id, sucursalId) {
  const sedeId = exigirSucursalId(sucursalId);
  const where = and(eq(gastos.id, id), eq(gastos.sucursalId, sedeId));

  const [borrado] = await db.delete(gastos).where(where).returning();
  return borrado ? toPublic(borrado) : null;
}
