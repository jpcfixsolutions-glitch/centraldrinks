import { z } from 'zod';
import * as botellasBarraService from '../services/botellasBarra.service.js';

const botellaSchema = z.object({
  productoId: z.number().int(),
  nombreProducto: z.string().min(1).optional(),
  nombre: z.string().min(1).optional(),
});

export async function listar(_req, res) {
  res.json(await botellasBarraService.listar());
}

export async function crear(req, res) {
  const parsed = botellaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
  }

  const nombreProducto = parsed.data.nombreProducto ?? parsed.data.nombre;
  if (!nombreProducto) {
    return res.status(400).json({ error: 'Nombre del producto requerido' });
  }

  const nueva = await botellasBarraService.crear({
    productoId: parsed.data.productoId,
    nombreProducto,
  });
  res.status(201).json(nueva);
}

export async function eliminar(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });

  const ok = await botellasBarraService.eliminar(id);
  if (!ok) return res.status(404).json({ error: 'Botella no encontrada' });
  res.json({ ok: true });
}
