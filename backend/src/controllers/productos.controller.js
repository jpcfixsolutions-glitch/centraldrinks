import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../services/db.js';
import { productos, categorias } from '../models/schema.js';

const productoSchema = z.object({
  nombre: z.string().min(1),
  categoriaId: z.number().int().nullable().optional(),
  costoUnitario: z.number().nonnegative().default(0),
  precioMesa: z.number().nonnegative().default(0),
  precioMostrador: z.number().nonnegative().default(0),
  stock: z.number().int().nonnegative().default(0),
  imagen: z.string().url().nullable().optional(),
});

const productoUpdateSchema = productoSchema.partial();

export async function listar(_req, res) {
  const items = await db
    .select({
      id: productos.id,
      nombre: productos.nombre,
      categoriaId: productos.categoriaId,
      categoria: categorias.nombre,
      costoUnitario: productos.costoUnitario,
      precioMesa: productos.precioMesa,
      precioMostrador: productos.precioMostrador,
      stock: productos.stock,
      imagen: productos.imagen,
      activo: productos.activo,
    })
    .from(productos)
    .leftJoin(categorias, eq(productos.categoriaId, categorias.id));
  res.json(items);
}

export async function crear(req, res) {
  const parsed = productoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
  }
  const [creado] = await db.insert(productos).values(parsed.data).returning();
  res.status(201).json(creado);
}

export async function actualizar(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });
  const parsed = productoUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' });
  }
  const [actualizado] = await db
    .update(productos)
    .set(parsed.data)
    .where(eq(productos.id, id))
    .returning();
  if (!actualizado) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(actualizado);
}

export async function eliminar(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });
  const [borrado] = await db.delete(productos).where(eq(productos.id, id)).returning();
  if (!borrado) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json({ ok: true });
}
