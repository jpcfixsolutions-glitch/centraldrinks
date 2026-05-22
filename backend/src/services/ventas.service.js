import { desc, eq, inArray } from 'drizzle-orm';
import { db } from './db.js';
import { ventas } from '../models/ventas.model.js';
import { ventaItems } from '../models/ventaItems.model.js';
import { ventaPagos } from '../models/ventaPagos.model.js';
import { idSesionAbierta } from './cierresCaja.service.js';
import { descontarStockVenta } from './productos.service.js';

function generarCodigo(tipo) {
  return `${tipo === 'mesa' ? 'MESA' : 'MOST'}${Date.now()}`;
}

async function itemsPorVentas(ventaIds) {
  if (ventaIds.length === 0) return [];
  return db.select().from(ventaItems).where(inArray(ventaItems.ventaId, ventaIds));
}

async function pagosPorVentas(ventaIds) {
  if (ventaIds.length === 0) return [];
  return db.select().from(ventaPagos).where(inArray(ventaPagos.ventaId, ventaIds));
}

export async function listar() {
  const lista = await db.select().from(ventas).orderBy(desc(ventas.fecha));
  const ventaIds = lista.map((v) => v.id);
  const items = await itemsPorVentas(ventaIds);
  const pagos = await pagosPorVentas(ventaIds);

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
    pagos: pagos
      .filter((p) => p.ventaId === v.id)
      .map((p) => ({
        metodoPago: p.metodoPago,
        monto: p.monto,
        recargo: p.recargo,
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
  const sesionId = await idSesionAbierta();
  if (!sesionId) {
    const err = new Error('No hay caja abierta. Abrí la caja antes de registrar ventas.');
    err.status = 400;
    throw err;
  }

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
      cierreCajaId: sesionId,
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

    await descontarStockVenta(data.items);
  }

  if (data.pagos?.length > 0) {
    await db.insert(ventaPagos).values(data.pagos.map((p) => ({ ...p, ventaId: venta.id })));
  }

  return venta;
}
