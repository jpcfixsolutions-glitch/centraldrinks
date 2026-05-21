import { z } from 'zod';
import * as metodosPagoService from '../services/metodosPago.service.js';

const metodoSchema = z.object({
  nombre: z.string().min(1),
  recargo: z.number().default(0),
});

const metodoUpdateSchema = metodoSchema.partial();

export async function listar(_req, res) {
  res.json(await metodosPagoService.listar());
}

export async function crear(req, res) {
  const parsed = metodoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
  }
  const creado = await metodosPagoService.crear(parsed.data);
  res.status(201).json(creado);
}

export async function actualizar(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });

  const parsed = metodoUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
  }

  const actualizado = await metodosPagoService.actualizar(id, parsed.data);
  if (!actualizado) return res.status(404).json({ error: 'Método de pago no encontrado' });
  res.json(actualizado);
}

export async function eliminar(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });

  const ok = await metodosPagoService.eliminar(id);
  if (!ok) return res.status(404).json({ error: 'Método de pago no encontrado' });
  res.json({ ok: true });
}
