import { z } from 'zod';
import * as cuentasService from '../services/cuentasCorrientes.service.js';

const pagoSchema = z.object({
  monto: z.number().positive(),
  metodoPago: z.string().min(1),
});

export async function listar(req, res) {
  res.json(await cuentasService.listar(req.user?.sucursalId ?? null));
}

export async function obtener(req, res) {
  const clienteId = Number(req.params.clienteId);
  if (!Number.isFinite(clienteId)) return res.status(400).json({ error: 'ID inválido' });

  const detalle = await cuentasService.obtenerDetalle(
    clienteId,
    req.user?.sucursalId ?? null
  );
  if (!detalle) return res.status(404).json({ error: 'Cuenta no encontrada' });
  res.json(detalle);
}

export async function registrarPago(req, res) {
  const clienteId = Number(req.params.clienteId);
  if (!Number.isFinite(clienteId)) return res.status(400).json({ error: 'ID inválido' });

  const parsed = pagoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
  }

  try {
    const result = await cuentasService.registrarPago(
      clienteId,
      parsed.data,
      req.user?.sub,
      req.user?.sucursalId ?? null
    );
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
}
