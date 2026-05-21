import { desc, eq } from 'drizzle-orm';
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

export async function listar() {
  const lista = await db.select().from(gastos).orderBy(desc(gastos.fecha));
  return lista.map(toPublic);
}

export async function crear(data, usuarioId) {
  const [creado] = await db
    .insert(gastos)
    .values({
      asunto: data.asunto,
      monto: data.monto,
      metodoPago: data.metodoPago ?? data.metodo,
      usuarioId: usuarioId ?? null,
    })
    .returning();
  return toPublic(creado);
}

export async function eliminar(id) {
  const [borrado] = await db.delete(gastos).where(eq(gastos.id, id)).returning();
  return borrado ? toPublic(borrado) : null;
}
