import { desc, eq, inArray, isNull } from 'drizzle-orm';
import { db } from './db.js';
import { cierresCaja } from '../models/cierresCaja.model.js';
import { ventas } from '../models/ventas.model.js';
import { ventaItems } from '../models/ventaItems.model.js';

export async function listar() {
  return db.select().from(cierresCaja).orderBy(desc(cierresCaja.fechaCierre));
}

export async function obtener(id) {
  const cierre = await db.query.cierresCaja.findFirst({ where: eq(cierresCaja.id, id) });
  if (!cierre) return null;

  const ventasCierre = await db.select().from(ventas).where(eq(ventas.cierreCajaId, id));
  const ventaIds = ventasCierre.map((v) => v.id);
  const items =
    ventaIds.length > 0
      ? await db.select().from(ventaItems).where(inArray(ventaItems.ventaId, ventaIds))
      : [];

  return {
    ...cierre,
    ventas: ventasCierre.map((v) => ({
      ...v,
      productos: items
        .filter((i) => i.ventaId === v.id)
        .map((i) => ({ nombre: i.nombreProducto, cantidad: i.cantidad, precio: i.precio })),
    })),
  };
}

export async function cerrar(usuario) {
  const ventasAbiertas = await db.select().from(ventas).where(isNull(ventas.cierreCajaId));
  if (ventasAbiertas.length === 0) return null;

  const cantidad = ventasAbiertas.length;
  const total = ventasAbiertas.reduce((acc, v) => acc + v.total, 0);

  const [cierre] = await db
    .insert(cierresCaja)
    .values({
      usuarioId: usuario.sub,
      empleado: usuario.username,
      cantidadVentas: cantidad,
      ingresoTotal: total,
    })
    .returning();

  await db
    .update(ventas)
    .set({ cierreCajaId: cierre.id })
    .where(isNull(ventas.cierreCajaId));

  return cierre;
}
