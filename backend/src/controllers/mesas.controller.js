import { z } from 'zod';
import * as mesasService from '../services/mesas.service.js';

const mesaUpdateSchema = z.object({
  estado: z.enum(['libre', 'ocupada', 'cerrando']).optional(),
  activa: z.boolean().optional(),
});

export async function listar(req, res) {
  res.json(await mesasService.listar(req.user?.sucursalId ?? null));
}

export async function crear(req, res) {
  const creada = await mesasService.crear(req.user?.sucursalId ?? null);
  res.status(201).json(creada);
}

export async function actualizar(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });

  const parsed = mesaUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
  }

  const actualizada = await mesasService.actualizar(id, parsed.data, req.user?.sucursalId ?? null);
  if (!actualizada) return res.status(404).json({ error: 'Mesa no encontrada' });
  res.json(actualizada);
}

export async function eliminar(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });

  const ok = await mesasService.eliminar(id, req.user?.sucursalId ?? null);
  if (!ok) return res.status(404).json({ error: 'Mesa no encontrada' });
  res.json({ ok: true });
}
