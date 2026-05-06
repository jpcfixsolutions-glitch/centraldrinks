import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../services/db.js';
import { categorias } from '../models/schema.js';

const categoriaSchema = z.object({
  nombre: z.string().min(1),
});

export async function listar(_req, res) {
  const todas = await db.select().from(categorias);
  res.json(todas);
}

export async function crear(req, res) {
  const parsed = categoriaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
  }
  const [creada] = await db.insert(categorias).values(parsed.data).returning();
  res.status(201).json(creada);
}

export async function actualizar(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });
  const parsed = categoriaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
  }
  const [actualizada] = await db
    .update(categorias)
    .set(parsed.data)
    .where(eq(categorias.id, id))
    .returning();
  if (!actualizada) return res.status(404).json({ error: 'Categoría no encontrada' });
  res.json(actualizada);
}

export async function eliminar(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });
  const [borrada] = await db.delete(categorias).where(eq(categorias.id, id)).returning();
  if (!borrada) return res.status(404).json({ error: 'Categoría no encontrada' });
  res.json({ ok: true });
}
