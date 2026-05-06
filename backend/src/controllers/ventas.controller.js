import { z } from 'zod';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../services/db.js';
import { ventas, ventaItems, ventaPagos, productos } from '../models/schema.js';

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
  const data = parsed.data;
  const codigo = `${data.tipo === 'mesa' ? 'MESA' : 'MOST'}${Date.now()}`;

  const [venta] = await db
    .insert(ventas)
    .values({
      codigo,
      tipo: data.tipo,
      numeroMesa: data.numeroMesa ?? null,
      total: data.total,
      descuento: data.descuento,
      metodoPago: data.metodoPago,
      usuarioId: req.user?.sub ?? null,
    })
    .returning();

  if (data.items.length > 0) {
    await db.insert(ventaItems).values(
      data.items.map((item) => ({
        ventaId: venta.id,
        productoId: item.productoId ?? null,
        nombreProducto: item.nombreProducto,
        precio: item.precio,
        cantidad: item.cantidad,
      }))
    );

    for (const item of data.items) {
      if (item.productoId) {
        await db
          .update(productos)
          .set({ stock: sql`${productos.stock} - ${item.cantidad}` })
          .where(eq(productos.id, item.productoId));
      }
    }
  }

  if (data.pagos && data.pagos.length > 0) {
    await db
      .insert(ventaPagos)
      .values(data.pagos.map((p) => ({ ...p, ventaId: venta.id })));
  }

  res.status(201).json({ id: venta.id, codigo: venta.codigo });
}

export async function listar(_req, res) {
  const lista = await db.select().from(ventas).orderBy(desc(ventas.fecha));
  res.json(lista);
}

export async function obtener(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });
  const venta = await db.query.ventas.findFirst({ where: eq(ventas.id, id) });
  if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });
  const items = await db.select().from(ventaItems).where(eq(ventaItems.ventaId, id));
  const pagos = await db.select().from(ventaPagos).where(eq(ventaPagos.ventaId, id));
  res.json({ ...venta, items, pagos });
}
