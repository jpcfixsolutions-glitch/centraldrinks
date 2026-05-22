import { desc, eq } from 'drizzle-orm';
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

export async function listar() {
  const lista = await db.select().from(botellasBarra).orderBy(desc(botellasBarra.fechaApertura));
  return lista.map(toPublic);
}

export async function crear({ productoId, nombreProducto }) {
  await descontarStock(productoId, 1);

  const [nueva] = await db
    .insert(botellasBarra)
    .values({ productoId, nombreProducto })
    .returning();
  return toPublic(nueva);
}

export async function eliminar(id) {
  const [borrada] = await db.delete(botellasBarra).where(eq(botellasBarra.id, id)).returning();
  return !!borrada;
}
