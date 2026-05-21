import { z } from 'zod';
import * as gastosFijosService from '../services/gastosFijos.service.js';

const gastoFijoSchema = z.object({
  nombre: z.string().min(1),
  monto: z.number().positive(),
});

export async function listar(_req, res) {
  res.json(await gastosFijosService.listar());
}

export async function crear(req, res) {
  const parsed = gastoFijoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
  }
  const nuevo = await gastosFijosService.crear(parsed.data);
  res.status(201).json(nuevo);
}

export async function actualizar(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });

  const parsed = gastoFijoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
  }

  const actualizado = await gastosFijosService.actualizar(id, parsed.data);
  if (!actualizado) return res.status(404).json({ error: 'Gasto fijo no encontrado' });
  res.json(actualizado);
}

export async function eliminar(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });

  const ok = await gastosFijosService.eliminar(id);
  if (!ok) return res.status(404).json({ error: 'Gasto fijo no encontrado' });
  res.json({ ok: true });
}
