import { z } from 'zod';
import * as mesaCuentasService from '../services/mesaCuentas.service.js';

const itemSchema = z.object({
  id: z.number().int().optional(),
  nombre: z.string().min(1),
  categoria: z.string().optional(),
  precio: z.number().nonnegative(),
  cantidad: z.number().int().positive(),
  imagen: z.string().nullable().optional(),
}).passthrough();

const upsertSchema = z.object({
  items: z.array(itemSchema).default([]),
  nombreCliente: z.string().optional().default(''),
});

export async function listar(req, res) {
  const cuentas = await mesaCuentasService.listar(req.user?.sucursalId ?? null);
  res.json(cuentas);
}

export async function upsert(req, res) {
  const numeroMesa = Number(req.params.numeroMesa);
  if (!Number.isFinite(numeroMesa) || numeroMesa <= 0) {
    return res.status(400).json({ error: 'Número de mesa inválido' });
  }

  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
  }

  const cuenta = await mesaCuentasService.upsert(
    req.user?.sucursalId ?? null,
    numeroMesa,
    parsed.data
  );
  res.json(cuenta);
}

export async function eliminar(req, res) {
  const numeroMesa = Number(req.params.numeroMesa);
  if (!Number.isFinite(numeroMesa) || numeroMesa <= 0) {
    return res.status(400).json({ error: 'Número de mesa inválido' });
  }

  await mesaCuentasService.eliminar(req.user?.sucursalId ?? null, numeroMesa);
  res.json({ ok: true });
}
