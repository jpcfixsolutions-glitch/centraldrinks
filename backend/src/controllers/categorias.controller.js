import { z } from 'zod';
import * as categoriasService from '../services/categorias.service.js';

const categoriaSchema = z.object({
  nombre: z.string().min(1),
});

export async function listar(_req, res) {
  res.json(await categoriasService.listar());
}

export async function crear(req, res) {
  const parsed = categoriaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
  }
  const creada = await categoriasService.crear(parsed.data);
  res.status(201).json(creada);
}

export async function actualizar(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });

  const parsed = categoriaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
  }

  const actualizada = await categoriasService.actualizar(id, parsed.data);
  if (!actualizada) return res.status(404).json({ error: 'Categoría no encontrada' });
  res.json(actualizada);
}

export async function eliminar(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });

  const ok = await categoriasService.eliminar(id);
  if (!ok) return res.status(404).json({ error: 'Categoría no encontrada' });
  res.json({ ok: true });
}
