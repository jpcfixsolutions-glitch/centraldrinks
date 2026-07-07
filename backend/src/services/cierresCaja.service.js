import { and, desc, eq, inArray, isNull, gte } from 'drizzle-orm';
import { db } from './db.js';
import { cierresCaja } from '../models/cierresCaja.model.js';
import { ventas } from '../models/ventas.model.js';
import { ventaItems } from '../models/ventaItems.model.js';
import { ventaPagos } from '../models/ventaPagos.model.js';
import { gastos } from '../models/gastos.model.js';
import { calcularResumenDesdeVentas } from './cajaResumen.js';

async function pagosMapPorVentas(ventaIds) {
  if (ventaIds.length === 0) return new Map();
  const pagos = await db.select().from(ventaPagos).where(inArray(ventaPagos.ventaId, ventaIds));
  const map = new Map();
  for (const p of pagos) {
    if (!map.has(p.ventaId)) map.set(p.ventaId, []);
    map.get(p.ventaId).push(p);
  }
  return map;
}

async function gastosDesde(fechaApertura, sucursalId) {
  if (!fechaApertura) return [];
  const condiciones = [gte(gastos.fecha, fechaApertura)];
  if (sucursalId != null) condiciones.push(eq(gastos.sucursalId, sucursalId));
  return db.select().from(gastos).where(and(...condiciones));
}

export async function obtenerAbierta(sucursalId) {
  const condiciones = [eq(cierresCaja.abierta, true)];
  if (sucursalId != null) condiciones.push(eq(cierresCaja.sucursalId, sucursalId));
  return db.query.cierresCaja.findFirst({ where: and(...condiciones) });
}

export async function abrir(usuario, efectivoInicial) {
  const sucursalId = usuario.sucursalId ?? null;
  const existente = await obtenerAbierta(sucursalId);
  if (existente) {
    const err = new Error('Ya hay una caja abierta');
    err.status = 409;
    throw err;
  }

  const [sesion] = await db
    .insert(cierresCaja)
    .values({
      usuarioId: usuario.sub,
      empleado: usuario.username,
      efectivoInicial,
      abierta: true,
      sucursalId,
    })
    .returning();

  return sesion;
}

export async function obtenerResumenActual(sucursalId) {
  const sesion = await obtenerAbierta(sucursalId);
  if (!sesion) return null;

  const ventasSesion = await db.select().from(ventas).where(eq(ventas.cierreCajaId, sesion.id));
  const ventaIds = ventasSesion.map((v) => v.id);
  const pagosMap = await pagosMapPorVentas(ventaIds);
  const gastosSesion = await gastosDesde(sesion.fechaApertura, sucursalId);

  const resumen = calcularResumenDesdeVentas({
    efectivoInicial: sesion.efectivoInicial,
    ventas: ventasSesion,
    pagosPorVenta: pagosMap,
    gastos: gastosSesion,
    fechaApertura: sesion.fechaApertura,
  });

  return { sesion, resumen };
}

export async function listar(sucursalId) {
  const condiciones = [eq(cierresCaja.abierta, false)];
  if (sucursalId != null) condiciones.push(eq(cierresCaja.sucursalId, sucursalId));

  return db
    .select()
    .from(cierresCaja)
    .where(and(...condiciones))
    .orderBy(desc(cierresCaja.fechaCierre));
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
  const pagos =
    ventaIds.length > 0
      ? await db.select().from(ventaPagos).where(inArray(ventaPagos.ventaId, ventaIds))
      : [];

  return {
    ...cierre,
    efectivoEsperado: cierre.efectivoInicial + cierre.ingresoEfectivo - cierre.egresoEfectivo,
    ventas: ventasCierre.map((v) => ({
      ...v,
      productos: items
        .filter((i) => i.ventaId === v.id)
        .map((i) => ({ nombre: i.nombreProducto, cantidad: i.cantidad, precio: i.precio })),
      pagos: pagos
        .filter((p) => p.ventaId === v.id)
        .map((p) => ({ metodoPago: p.metodoPago, monto: p.monto, recargo: p.recargo })),
    })),
  };
}

export async function cerrar(usuario) {
  const sucursalId = usuario.sucursalId ?? null;
  const sesion = await obtenerAbierta(sucursalId);
  if (!sesion) return null;

  await db
    .update(ventas)
    .set({ cierreCajaId: sesion.id })
    .where(and(isNull(ventas.cierreCajaId), sucursalId != null ? eq(ventas.sucursalId, sucursalId) : undefined));

  const ventasSesion = await db.select().from(ventas).where(eq(ventas.cierreCajaId, sesion.id));
  const ventaIds = ventasSesion.map((v) => v.id);
  const pagosMap = await pagosMapPorVentas(ventaIds);
  const gastosSesion = await gastosDesde(sesion.fechaApertura, sucursalId);

  const resumen = calcularResumenDesdeVentas({
    efectivoInicial: sesion.efectivoInicial,
    ventas: ventasSesion,
    pagosPorVenta: pagosMap,
    gastos: gastosSesion,
    fechaApertura: sesion.fechaApertura,
  });

  const [cierre] = await db
    .update(cierresCaja)
    .set({
      abierta: false,
      fechaCierre: new Date().toISOString(),
      cantidadVentas: resumen.cantidadVentas,
      ingresoTotal: resumen.ingresoTotal,
      ingresoEfectivo: resumen.ingresoEfectivo,
      ingresoVirtual: resumen.ingresoVirtual,
      egresoEfectivo: resumen.egresoEfectivo,
      empleado: usuario.username,
      usuarioId: usuario.sub,
    })
    .where(eq(cierresCaja.id, sesion.id))
    .returning();

  return {
    ...cierre,
    efectivoEsperado: resumen.efectivoEsperado,
    resumen,
  };
}

export async function idSesionAbierta(sucursalId) {
  const sesion = await obtenerAbierta(sucursalId);
  return sesion?.id ?? null;
}
