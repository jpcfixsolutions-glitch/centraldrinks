import { desc, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '../services/db.js';
import { cierresCaja, ventas, ventaItems } from '../models/schema.js';

export async function listar(_req, res) {
  const cierres = await db.select().from(cierresCaja).orderBy(desc(cierresCaja.fechaCierre));
  res.json(cierres);
}

export async function obtener(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });
  const cierre = await db.query.cierresCaja.findFirst({ where: eq(cierresCaja.id, id) });
  if (!cierre) return res.status(404).json({ error: 'Cierre no encontrado' });

  const ventasCierre = await db.select().from(ventas).where(eq(ventas.cierreCajaId, id));
  const ventaIds = ventasCierre.map((v) => v.id);
  const items =
    ventaIds.length > 0
      ? await db.select().from(ventaItems).where(inArray(ventaItems.ventaId, ventaIds))
      : [];

  res.json({
    ...cierre,
    ventas: ventasCierre.map((v) => ({
      ...v,
      productos: items
        .filter((i) => i.ventaId === v.id)
        .map((i) => ({ nombre: i.nombreProducto, cantidad: i.cantidad, precio: i.precio })),
    })),
  });
}

export async function cerrarCaja(req, res) {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });

  const ventasAbiertas = await db.select().from(ventas).where(isNull(ventas.cierreCajaId));
  if (ventasAbiertas.length === 0) {
    return res.status(400).json({ error: 'No hay ventas pendientes para cerrar la caja' });
  }

  const cantidad = ventasAbiertas.length;
  const total = ventasAbiertas.reduce((acc, v) => acc + v.total, 0);

  const [cierre] = await db
    .insert(cierresCaja)
    .values({
      usuarioId: req.user.sub,
      empleado: req.user.username,
      cantidadVentas: cantidad,
      ingresoTotal: total,
    })
    .returning();

  await db
    .update(ventas)
    .set({ cierreCajaId: cierre.id })
    .where(isNull(ventas.cierreCajaId));

  res.status(201).json(cierre);
}
