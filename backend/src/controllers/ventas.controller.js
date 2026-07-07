import { z } from 'zod';
import * as ventasService from '../services/ventas.service.js';

const itemSchema = z.object({
  productoId: z.number().int().nullable().optional(),
  nombreProducto: z.string().min(1),
  precio: z.number().nonnegative(),
  cantidad: z.number().int().positive(),
});

const pagoSchema = z.object({
  metodoPago: z.string().min(1),
  monto: z.number().nonnegative(),
  recargo: z.number().default(0),
});

const ventaSchema = z.object({
  tipo: z.enum(['mostrador', 'mesa']),
  numeroMesa: z.number().int().positive().optional(),
  total: z.number().nonnegative(),
  descuento: z.number().nonnegative().default(0),
  metodoPago: z.string().min(1),
  items: z.array(itemSchema).min(1),
  pagos: z.array(pagoSchema).optional(),
});

export async function crear(req, res) {
  const parsed = ventaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
  }

  try {
    const venta = await ventasService.crear(
      parsed.data,
      req.user?.sub,
      req.user?.sucursalId ?? null
    );
    res.status(201).json({ id: venta.id, codigo: venta.codigo, fecha: venta.fecha, cierreCajaId: venta.cierreCajaId });
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ error: err.message });
    throw err;
  }
}

export async function listar(req, res) {
  res.json(await ventasService.listar(req.user?.sucursalId ?? null));
}

export async function obtener(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });

  const venta = await ventasService.obtener(id);
  if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });
  res.json(venta);
}
