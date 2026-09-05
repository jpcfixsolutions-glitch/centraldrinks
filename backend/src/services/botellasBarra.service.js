import { and, desc, eq } from 'drizzle-orm';
import { db } from './db.js';
import { botellasBarra } from '../models/botellasBarra.model.js';
import { descontarStock } from './productos.service.js';
import { exigirSucursalId } from '../lib/sucursal.js';

function toPublic(b) {
  return {
    id: b.id,
    productoId: b.productoId,
    nombre: b.nombreProducto,
    fecha: b.fechaApertura,
  };
}

export async function listar(sucursalId) {
  const sedeId = exigirSucursalId(sucursalId);
  const lista = await db
    .select()
    .from(botellasBarra)
    .where(eq(botellasBarra.sucursalId, sedeId))
    .orderBy(desc(botellasBarra.fechaApertura));
  return lista.map(toPublic);
}

export async function crear({ productoId, nombreProducto }, sucursalId) {
  const sedeId = exigirSucursalId(sucursalId);
  await descontarStock(productoId, 1, sedeId);

  const [nueva] = await db
    .insert(botellasBarra)
    .values({ productoId, nombreProducto, sucursalId: sedeId })
    .returning();
  return toPublic(nueva);
}

export async function eliminar(id, sucursalId) {
  const sedeId = exigirSucursalId(sucursalId);
  const where = and(eq(botellasBarra.id, id), eq(botellasBarra.sucursalId, sedeId));

  const [borrada] = await db.delete(botellasBarra).where(where).returning();
  return !!borrada;
}
