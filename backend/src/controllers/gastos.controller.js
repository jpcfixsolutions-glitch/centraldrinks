import { z } from 'zod';
import * as gastosService from '../services/gastos.service.js';

const gastoSchema = z.object({
  asunto: z.string().min(1),
  monto: z.number().positive(),
  metodo: z.enum(['Efectivo', 'Virtual']).optional(),
  metodoPago: z.enum(['Efectivo', 'Virtual']).optional(),
});

export async function listar(req, res) {
  res.json(await gastosService.listar(req.user?.sucursalId ?? null));
}

export async function crear(req, res) {
  const parsed = gastoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
  }

  const metodo = parsed.data.metodo ?? parsed.data.metodoPago;
  if (!metodo) {
    return res.status(400).json({ error: 'Método de pago requerido' });
  }

  const creado = await gastosService.crear(
    { asunto: parsed.data.asunto, monto: parsed.data.monto, metodoPago: metodo },
    req.user?.sub,
    req.user?.sucursalId ?? null
  );
  res.status(201).json(creado);
}

export async function eliminar(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });

  const borrado = await gastosService.eliminar(id, req.user?.sucursalId ?? null);
  if (!borrado) return res.status(404).json({ error: 'Gasto no encontrado' });
  res.json({ ok: true });
}
