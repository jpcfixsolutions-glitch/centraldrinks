import { eq, sql } from 'drizzle-orm';
import { db } from './db.js';
import { productos } from '../models/productos.model.js';
import { categorias } from '../models/categorias.model.js';

export async function listar() {
  return db
    .select({
      id: productos.id,
      nombre: productos.nombre,
      categoriaId: productos.categoriaId,
      categoria: categorias.nombre,
      costoUnitario: productos.costoUnitario,
      precioMesa: productos.precioMesa,
      precioMostrador: productos.precioMostrador,
      stock: productos.stock,
      stockMinimo: productos.stockMinimo,
      imagen: productos.imagen,
      activo: productos.activo,
    })
    .from(productos)
    .leftJoin(categorias, eq(productos.categoriaId, categorias.id));
}

export async function crear(data) {
  const [creado] = await db.insert(productos).values(data).returning();
  return creado;
}

export async function actualizar(id, data) {
  const [actualizado] = await db.update(productos).set(data).where(eq(productos.id, id)).returning();
  return actualizado ?? null;
}

export async function eliminar(id) {
  const [borrado] = await db.delete(productos).where(eq(productos.id, id)).returning();
  return !!borrado;
}

export async function descontarStock(productoId, cantidad) {
  await db
    .update(productos)
    .set({ stock: sql`${productos.stock} - ${cantidad}` })
    .where(eq(productos.id, productoId));
}
