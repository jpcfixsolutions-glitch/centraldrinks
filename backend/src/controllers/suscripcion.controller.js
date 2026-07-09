import { z } from 'zod';
import * as suscripcionService from '../services/suscripcion.service.js';

const updateSchema = z.object({
  diaVencimiento: z.number().int().min(1).max(31),
});

// GET /api/suscripcion — estado actual (cualquier usuario autenticado)
export async function obtener(_req, res) {
  const data = await suscripcionService.obtener();
  if (!data) return res.status(404).json({ error: 'Suscripción no configurada' });
  return res.json(data);
}

// PUT /api/suscripcion — actualizar día de vencimiento (solo creador)
export async function actualizar(req, res) {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
  }
  const data = await suscripcionService.actualizar(parsed.data.diaVencimiento);
  if (!data) return res.status(500).json({ error: 'Error al actualizar suscripción' });
  return res.json(data);
}

// POST /api/suscripcion/reactivar — avanza un mes (solo creador)
export async function reactivar(_req, res) {
  const data = await suscripcionService.reactivar();
  if (!data) return res.status(500).json({ error: 'Error al reactivar suscripción' });
  return res.json(data);
}
