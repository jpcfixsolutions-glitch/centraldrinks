import { desc, eq, inArray } from 'drizzle-orm';
import { db } from './db.js';
import { clientes } from '../models/clientes.model.js';
import { cuentaMovimientos } from '../models/cuentaMovimientos.model.js';
import { ventaItems } from '../models/ventaItems.model.js';
import { ventas } from '../models/ventas.model.js';
import * as clientesService from './clientes.service.js';
import { idSesionAbierta } from './cierresCaja.service.js';
import { METODO_CUENTA_CORRIENTE } from '../lib/cuentaCorriente.js';

async function movimientosDeCliente(clienteId) {
  return db
    .select()
    .from(cuentaMovimientos)
    .where(eq(cuentaMovimientos.clienteId, clienteId))
    .orderBy(desc(cuentaMovimientos.fecha));
}

export function calcularDeuda(movimientos) {
  let deuda = 0;
  for (const m of movimientos) {
    if (m.tipo === 'cargo') deuda += m.monto;
    else if (m.tipo === 'pago') deuda -= m.monto;
  }
  return Math.max(0, Math.round(deuda * 100) / 100);
}

export async function listar(sucursalId) {
  const where = sucursalId != null ? eq(clientes.sucursalId, sucursalId) : undefined;
  const listaClientes = await db.select().from(clientes).where(where);

  const clienteIds = listaClientes.map((c) => c.id);
  const todosMovs =
    clienteIds.length > 0
      ? await db
          .select()
          .from(cuentaMovimientos)
          .where(inArray(cuentaMovimientos.clienteId, clienteIds))
      : [];

  const porCliente = new Map();
  for (const m of todosMovs) {
    if (!porCliente.has(m.clienteId)) porCliente.set(m.clienteId, []);
    porCliente.get(m.clienteId).push(m);
  }

  return listaClientes
    .map((c) => {
      const movs = porCliente.get(c.id) ?? [];
      return {
        id: c.id,
        nombre: c.nombre,
        apellido: c.apellido,
        documento: c.documento,
        telefono: c.telefono,
        nombreCompleto: `${c.nombre} ${c.apellido}`.trim(),
        deuda: calcularDeuda(movs),
        cantidadMovimientos: movs.length,
      };
    })
    .sort((a, b) => b.deuda - a.deuda || a.apellido.localeCompare(b.apellido));
}

export async function obtenerDetalle(clienteId, sucursalId) {
  const cliente = await clientesService.buscarPorId(clienteId, sucursalId);
  if (!cliente) return null;

  const movimientos = await movimientosDeCliente(clienteId);
  const ventaIds = movimientos.filter((m) => m.ventaId).map((m) => m.ventaId);
  const items =
    ventaIds.length > 0
      ? await db.select().from(ventaItems).where(inArray(ventaItems.ventaId, ventaIds))
      : [];
  const ventasRows =
    ventaIds.length > 0
      ? await db.select().from(ventas).where(inArray(ventas.id, ventaIds))
      : [];
  const ventasMap = new Map(ventasRows.map((v) => [v.id, v]));

  const historial = movimientos.map((m) => {
    const venta = m.ventaId ? ventasMap.get(m.ventaId) : null;
    const productos = m.ventaId
      ? items
          .filter((i) => i.ventaId === m.ventaId)
          .map((i) => ({
            nombre: i.nombreProducto,
            precio: i.precio,
            cantidad: i.cantidad,
          }))
      : [];

    let detalleParsed = null;
    if (m.detalle) {
      try {
        detalleParsed = JSON.parse(m.detalle);
      } catch {
        detalleParsed = m.detalle;
      }
    }

    return {
      id: m.id,
      tipo: m.tipo,
      monto: m.monto,
      metodoPago: m.metodoPago,
      fecha: m.fecha,
      ventaId: m.ventaId,
      codigoVenta: venta?.codigo ?? null,
      productos,
      detalle: detalleParsed,
    };
  });

  return {
    cliente,
    deuda: calcularDeuda(movimientos),
    movimientos: historial,
  };
}

export async function registrarCargo({
  clienteId,
  monto,
  ventaId,
  items,
  sucursalId,
  usuarioId,
}) {
  const cliente = await clientesService.buscarPorId(clienteId, sucursalId);
  if (!cliente) {
    const err = new Error('Cliente no encontrado');
    err.status = 404;
    throw err;
  }

  const detalle = JSON.stringify({
    items: (items || []).map((i) => ({
      nombre: i.nombreProducto,
      precio: i.precio,
      cantidad: i.cantidad,
    })),
  });

  const [mov] = await db
    .insert(cuentaMovimientos)
    .values({
      clienteId,
      tipo: 'cargo',
      monto,
      ventaId: ventaId ?? null,
      metodoPago: METODO_CUENTA_CORRIENTE,
      detalle,
      sucursalId: sucursalId ?? null,
      usuarioId: usuarioId ?? null,
    })
    .returning();

  return mov;
}

export async function registrarPago(clienteId, { monto, metodoPago }, usuarioId, sucursalId) {
  const cliente = await clientesService.buscarPorId(clienteId, sucursalId);
  if (!cliente) {
    const err = new Error('Cliente no encontrado');
    err.status = 404;
    throw err;
  }

  if (!monto || monto <= 0) {
    const err = new Error('El monto debe ser mayor a 0');
    err.status = 400;
    throw err;
  }

  const movimientos = await movimientosDeCliente(clienteId);
  const deuda = calcularDeuda(movimientos);
  if (monto > deuda + 0.009) {
    const err = new Error(`El pago supera la deuda ($${deuda.toLocaleString()})`);
    err.status = 400;
    throw err;
  }

  const sesionId = await idSesionAbierta(sucursalId);

  const [mov] = await db
    .insert(cuentaMovimientos)
    .values({
      clienteId,
      tipo: 'pago',
      monto,
      metodoPago,
      detalle: JSON.stringify({ concepto: 'Pago a cuenta corriente' }),
      cierreCajaId: sesionId ?? null,
      sucursalId: sucursalId ?? null,
      usuarioId: usuarioId ?? null,
    })
    .returning();

  return {
    movimiento: mov,
    deudaRestante: Math.max(0, Math.round((deuda - monto) * 100) / 100),
  };
}
