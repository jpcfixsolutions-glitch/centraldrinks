import { and, desc, eq } from 'drizzle-orm';
import { db } from './db.js';
import { botellasBarra } from '../models/botellasBarra.model.js';
import { descontarStock } from './productos.service.js';

function toPublic(b) {
  return {
    id: b.id,
    productoId: b.productoId,
    nombre: b.nombreProducto,
    fecha: b.fechaApertura,
  };
}

export async function listar(sucursalId) {
  const where = sucursalId != null ? eq(botellasBarra.sucursalId, sucursalId) : undefined;
  const lista = await db
    .select()
    .from(botellasBarra)
    .where(where)
    .orderBy(desc(botellasBarra.fechaApertura));
  return lista.map(toPublic);
}

export async function crear({ productoId, nombreProducto }, sucursalId) {
  await descontarStock(productoId, 1);

  const [nueva] = await db
    .insert(botellasBarra)
    .values({ productoId, nombreProducto, sucursalId: sucursalId ?? null })
    .returning();
  return toPublic(nueva);
}

export async function eliminar(id, sucursalId) {
  const where = sucursalId != null
    ? and(eq(botellasBarra.id, id), eq(botellasBarra.sucursalId, sucursalId))
    : eq(botellasBarra.id, id);

  const [borrada] = await db.delete(botellasBarra).where(where).returning();
  return !!borrada;
}
