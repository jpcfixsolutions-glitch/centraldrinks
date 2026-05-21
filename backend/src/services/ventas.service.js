import { desc, eq, sql, inArray } from 'drizzle-orm';
import { db } from './db.js';
import { ventas } from '../models/ventas.model.js';
import { ventaItems } from '../models/ventaItems.model.js';
import { ventaPagos } from '../models/ventaPagos.model.js';
import { productos } from '../models/productos.model.js';

function generarCodigo(tipo) {
  return `${tipo === 'mesa' ? 'MESA' : 'MOST'}${Date.now()}`;
}

async function itemsPorVentas(ventaIds) {
  if (ventaIds.length === 0) return [];
  return db.select().from(ventaItems).where(inArray(ventaItems.ventaId, ventaIds));
}

export async function listar() {
  const lista = await db.select().from(ventas).orderBy(desc(ventas.fecha));
  const ventaIds = lista.map((v) => v.id);
  const items = await itemsPorVentas(ventaIds);

  return lista.map((v) => ({
    ...v,
    items: items
      .filter((i) => i.ventaId === v.id)
      .map((i) => ({
        productoId: i.productoId,
        nombreProducto: i.nombreProducto,
        precio: i.precio,
        cantidad: i.cantidad,
      })),
  }));
}

export async function obtener(id) {
  const venta = await db.query.ventas.findFirst({ where: eq(ventas.id, id) });
  if (!venta) return null;
  const items = await db.select().from(ventaItems).where(eq(ventaItems.ventaId, id));
  const pagos = await db.select().from(ventaPagos).where(eq(ventaPagos.ventaId, id));
  return { ...venta, items, pagos };
}

export async function crear(data, usuarioId) {
  const codigo = generarCodigo(data.tipo);

  const [venta] = await db
    .insert(ventas)
    .values({
      codigo,
      tipo: data.tipo,
      numeroMesa: data.numeroMesa ?? null,
      total: data.total,
      descuento: data.descuento,
      metodoPago: data.metodoPago,
      usuarioId: usuarioId ?? null,
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

  if (data.pagos?.length > 0) {
    await db.insert(ventaPagos).values(data.pagos.map((p) => ({ ...p, ventaId: venta.id })));
  }

  return venta;
}
