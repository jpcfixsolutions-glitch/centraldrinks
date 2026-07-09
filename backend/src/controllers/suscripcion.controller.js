import { z } from 'zod';
import * as suscripcionService from '../services/suscripcion.service.js';

const updateSchema = z.object({
  sucursalId: z.number().int().positive(),
  diaVencimiento: z.number().int().min(1).max(31),
});

// GET /api/suscripcion/:sucursalId  — estado actual de una sucursal (creador o la propia sucursal)
export async function obtener(req, res) {
  const sucursalId = Number(req.params.sucursalId);
  if (!Number.isFinite(sucursalId)) {
    return res.status(400).json({ error: 'sucursalId inválido' });
  }

  // Un usuario normal solo puede consultar su propia sucursal
  if (req.user.rol !== 'creador' && req.user.sucursalId !== sucursalId) {
    return res.status(403).json({ error: 'Sin permisos' });
  }

  const data = await suscripcionService.obtenerPorSucursal(sucursalId);
  if (!data) return res.status(404).json({ error: 'Suscripción no encontrada' });
  return res.json(data);
}

// GET /api/suscripcion  — listar todas (solo creador)
export async function listar(_req, res) {
  const data = await suscripcionService.obtenerTodas();
  return res.json(data);
}

// PUT /api/suscripcion  — actualizar día de vencimiento (solo creador)
export async function actualizar(req, res) {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
  }

  const { sucursalId, diaVencimiento } = parsed.data;
  const data = await suscripcionService.actualizar(sucursalId, diaVencimiento);
  if (!data) return res.status(404).json({ error: 'Suscripción no encontrada para esa sucursal' });
  return res.json(data);
}
