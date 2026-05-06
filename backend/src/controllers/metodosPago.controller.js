import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../services/db.js';
import { metodosPago } from '../models/schema.js';

const metodoSchema = z.object({
  nombre: z.string().min(1),
  recargo: z.number().default(0),
});

const metodoUpdateSchema = metodoSchema.partial();

export async function listar(_req, res) {
  const todos = await db.select().from(metodosPago);
  res.json(todos);
}

export async function crear(req, res) {
  const parsed = metodoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
  }
  const [creado] = await db.insert(metodosPago).values(parsed.data).returning();
  res.status(201).json(creado);
}

export async function actualizar(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });
  const parsed = metodoUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
  }
  const [actualizado] = await db
    .update(metodosPago)
    .set(parsed.data)
    .where(eq(metodosPago.id, id))
    .returning();
  if (!actualizado) return res.status(404).json({ error: 'Método de pago no encontrado' });
  res.json(actualizado);
}

export async function eliminar(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });
  const [borrado] = await db.delete(metodosPago).where(eq(metodosPago.id, id)).returning();
  if (!borrado) return res.status(404).json({ error: 'Método de pago no encontrado' });
  res.json({ ok: true });
}
