import { eq } from 'drizzle-orm';
import { db } from './db.js';
import { suscripciones } from '../models/suscripciones.model.js';

/**
 * Calcula el estado de suscripción para una sucursal dado su diaVencimiento.
 * Retorna { diaVencimiento, diasRestantes, estado: 'activa' | 'por_vencer' | 'expirada' }
 */
export function calcularEstado(diaVencimiento) {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes  = hoy.getMonth(); // 0-indexed

  // Construir la fecha de vencimiento de este mes (clampeado al último día del mes)
  const ultimoDiaMes = new Date(anio, mes + 1, 0).getDate();
  const dia = Math.min(diaVencimiento, ultimoDiaMes);
  const vencimiento = new Date(anio, mes, dia, 23, 59, 59, 999);

  // Si ya pasó este mes, el próximo vencimiento es el mes que viene
  const hoyMs = hoy.getTime();
  const diasRestantes = Math.ceil((vencimiento.getTime() - hoyMs) / (1000 * 60 * 60 * 24));

  let estado;
  if (diasRestantes < 0) {
    estado = 'expirada';
  } else if (diasRestantes <= 5) {
    estado = 'por_vencer';
  } else {
    estado = 'activa';
  }

  return {
    diaVencimiento,
    diasRestantes: Math.max(diasRestantes, 0),
    fechaVencimiento: vencimiento.toISOString(),
    estado,
  };
}

export async function obtenerPorSucursal(sucursalId) {
  const row = await db.query.suscripciones.findFirst({
    where: eq(suscripciones.sucursalId, sucursalId),
  });
  if (!row) return null;
  return { ...row, ...calcularEstado(row.diaVencimiento) };
}

export async function obtenerTodas() {
  const rows = await db.select().from(suscripciones);
  return rows.map((r) => ({ ...r, ...calcularEstado(r.diaVencimiento) }));
}

export async function actualizar(sucursalId, diaVencimiento) {
  const ahora = new Date().toISOString();
  const [updated] = await db
    .update(suscripciones)
    .set({ diaVencimiento, updatedAt: ahora })
    .where(eq(suscripciones.sucursalId, sucursalId))
    .returning();

  if (!updated) return null;
  return { ...updated, ...calcularEstado(updated.diaVencimiento) };
}
