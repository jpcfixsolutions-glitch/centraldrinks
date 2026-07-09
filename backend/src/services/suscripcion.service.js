import { eq } from 'drizzle-orm';
import { db } from './db.js';
import { suscripciones } from '../models/suscripciones.model.js';

const SINGLETON_ID = 1;

// ── Helpers de fecha ────────────────────────────────────────────────────────

/**
 * Dado un día 1-31, calcula la próxima ocurrencia de ese día:
 * - Si hoy es ANTES de ese día en el mes actual → usa este mes.
 * - Si hoy es ESE día O ya pasó → usa el mes siguiente.
 * Retorna una fecha ISO al final del día (23:59:59.999).
 */
export function calcularProximaFecha(dia) {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes  = hoy.getMonth(); // 0-indexed
  const diaHoy = hoy.getDate();

  const ultimoDiaMesActual = new Date(anio, mes + 1, 0).getDate();
  const diaEfectivoActual  = Math.min(dia, ultimoDiaMesActual);

  if (diaHoy < diaEfectivoActual) {
    // Este mes todavía no llegó
    return new Date(anio, mes, diaEfectivoActual, 23, 59, 59, 999).toISOString();
  }

  // Ya pasó o es hoy → próximo mes
  const mesProx = mes === 11 ? 0 : mes + 1;
  const anioProx = mes === 11 ? anio + 1 : anio;
  const ultimoDiaMesProx = new Date(anioProx, mesProx + 1, 0).getDate();
  const diaEfectivoProx  = Math.min(dia, ultimoDiaMesProx);
  return new Date(anioProx, mesProx, diaEfectivoProx, 23, 59, 59, 999).toISOString();
}

/**
 * Avanza la fechaVencimiento actual exactamente un mes
 * (preservando el diaVencimiento, ajustando si el mes no tiene ese día).
 */
function avanzarUnMes(fechaActual, dia) {
  const f = new Date(fechaActual);
  const mesProx  = f.getMonth() === 11 ? 0 : f.getMonth() + 1;
  const anioProx = f.getMonth() === 11 ? f.getFullYear() + 1 : f.getFullYear();
  const ultimoDia = new Date(anioProx, mesProx + 1, 0).getDate();
  const diaEfectivo = Math.min(dia, ultimoDia);
  return new Date(anioProx, mesProx, diaEfectivo, 23, 59, 59, 999).toISOString();
}

// ── Estado ──────────────────────────────────────────────────────────────────

/**
 * Calcula el estado a partir de la fechaVencimiento almacenada.
 * - 'expirada'   → fechaVencimiento ya pasó (today > fechaVencimiento)
 * - 'por_vencer' → quedan 0-5 días
 * - 'activa'     → más de 5 días
 */
export function calcularEstado(diaVencimiento, fechaVencimiento) {
  const hoy    = new Date();
  const vence  = new Date(fechaVencimiento);
  const diffMs = vence.getTime() - hoy.getTime();
  const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

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
    fechaVencimiento,
    estado,
  };
}

// ── CRUD ────────────────────────────────────────────────────────────────────

export async function obtener() {
  const row = await db.query.suscripciones.findFirst({
    where: eq(suscripciones.id, SINGLETON_ID),
  });
  if (!row) return null;
  return calcularEstado(row.diaVencimiento, row.fechaVencimiento);
}

/**
 * Guarda el día de vencimiento y calcula la próxima fecha automáticamente.
 * Si el día ya pasó este mes, apunta al mes siguiente (no expira de inmediato).
 */
export async function actualizar(dia) {
  const fechaVencimiento = calcularProximaFecha(dia);
  const ahora = new Date().toISOString();
  const [updated] = await db
    .update(suscripciones)
    .set({ diaVencimiento: dia, fechaVencimiento, updatedAt: ahora })
    .where(eq(suscripciones.id, SINGLETON_ID))
    .returning();
  if (!updated) return null;
  return calcularEstado(updated.diaVencimiento, updated.fechaVencimiento);
}

/**
 * Reactivación: avanza la fechaVencimiento un mes hacia adelante.
 * Útil cuando el cliente paga y el creador desbloquea el sistema.
 */
export async function reactivar() {
  const row = await db.query.suscripciones.findFirst({
    where: eq(suscripciones.id, SINGLETON_ID),
  });
  if (!row) return null;

  const nuevaFecha = avanzarUnMes(row.fechaVencimiento, row.diaVencimiento);
  const ahora = new Date().toISOString();
  const [updated] = await db
    .update(suscripciones)
    .set({ fechaVencimiento: nuevaFecha, updatedAt: ahora })
    .where(eq(suscripciones.id, SINGLETON_ID))
    .returning();
  if (!updated) return null;
  return calcularEstado(updated.diaVencimiento, updated.fechaVencimiento);
}
