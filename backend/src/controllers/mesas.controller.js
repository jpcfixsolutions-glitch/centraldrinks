import { z } from 'zod';
import { asc, eq } from 'drizzle-orm';
import { db } from '../services/db.js';
import { mesas } from '../models/schema.js';

const mesaUpdateSchema = z.object({
  estado: z.enum(['libre', 'ocupada', 'cerrando']).optional(),
  activa: z.boolean().optional(),
});

export async function listar(_req, res) {
  const todas = await db.select().from(mesas).orderBy(asc(mesas.numero));
  res.json(todas);
}

export async function crear(_req, res) {
  const todas = await db.select().from(mesas).orderBy(asc(mesas.numero));
  const proximoNumero = (todas[todas.length - 1]?.numero ?? 0) + 1;
  const [creada] = await db.insert(mesas).values({ numero: proximoNumero }).returning();
  res.status(201).json(creada);
}

export async function actualizar(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });
  const parsed = mesaUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
  }
  const [actualizada] = await db.update(mesas).set(parsed.data).where(eq(mesas.id, id)).returning();
  if (!actualizada) return res.status(404).json({ error: 'Mesa no encontrada' });
  res.json(actualizada);
}

export async function eliminar(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });
  const [borrada] = await db.delete(mesas).where(eq(mesas.id, id)).returning();
  if (!borrada) return res.status(404).json({ error: 'Mesa no encontrada' });
  res.json({ ok: true });
}
