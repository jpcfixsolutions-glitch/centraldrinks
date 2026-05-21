import { z } from 'zod';
import * as auditLogsService from '../services/auditLogs.service.js';

const logSchema = z.object({
  tipo: z.string().min(1),
  mensaje: z.string().min(1),
  detalle: z.string().optional(),
});

export async function listar(_req, res) {
  res.json(await auditLogsService.listar());
}

export async function crear(req, res) {
  const parsed = logSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
  }

  const nuevo = await auditLogsService.crear(parsed.data, req.user?.sub);
  res.status(201).json(nuevo);
}
