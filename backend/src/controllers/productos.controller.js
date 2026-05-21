import { z } from 'zod';
import * as productosService from '../services/productos.service.js';

const productoSchema = z.object({
  nombre: z.string().min(1),
  categoriaId: z.number().int().nullable().optional(),
  costoUnitario: z.number().nonnegative().default(0),
  precioMesa: z.number().nonnegative().default(0),
  precioMostrador: z.number().nonnegative().default(0),
  stock: z.number().int().nonnegative().default(0),
  stockMinimo: z.number().int().nonnegative().optional(),
  imagen: z.string().url().nullable().optional(),
});

const productoUpdateSchema = productoSchema.partial();

export async function listar(_req, res) {
  res.json(await productosService.listar());
}

export async function crear(req, res) {
  const parsed = productoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
  }
  const creado = await productosService.crear(parsed.data);
  res.status(201).json(creado);
}

export async function actualizar(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });

  const parsed = productoUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
  }

  const actualizado = await productosService.actualizar(id, parsed.data);
  if (!actualizado) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(actualizado);
}

export async function eliminar(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });

  const ok = await productosService.eliminar(id);
  if (!ok) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json({ ok: true });
}
