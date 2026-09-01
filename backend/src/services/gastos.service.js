import { and, desc, eq } from 'drizzle-orm';
import { db } from './db.js';
import { gastos } from '../models/gastos.model.js';

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
  const where = sucursalId != null ? eq(gastos.sucursalId, sucursalId) : undefined;
  const lista = await db.select().from(gastos).where(where).orderBy(desc(gastos.fecha));
  return lista.map(toPublic);
}

export async function crear(data, usuarioId, sucursalId) {
  const values = {
    asunto: data.asunto,
    monto: data.monto,
    metodoPago: data.metodoPago ?? data.metodo,
    usuarioId: usuarioId ?? null,
    sucursalId: sucursalId ?? null,
  };
  // Si no viene fecha, la DB aplica CURRENT_TIMESTAMP (comportamiento actual)
  if (data.fecha) values.fecha = data.fecha;

  const [creado] = await db.insert(gastos).values(values).returning();
  return toPublic(creado);
}

export async function eliminar(id, sucursalId) {
  const where = sucursalId != null
    ? and(eq(gastos.id, id), eq(gastos.sucursalId, sucursalId))
    : eq(gastos.id, id);

  const [borrado] = await db.delete(gastos).where(where).returning();
  return borrado ? toPublic(borrado) : null;
}
