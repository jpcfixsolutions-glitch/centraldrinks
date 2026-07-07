import { sql } from 'drizzle-orm';
import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { categorias } from './categorias.model.js';
import { sucursales } from './sucursales.model.js';

export const productos = sqliteTable('productos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nombre: text('nombre').notNull(),
  categoriaId: integer('categoria_id').references(() => categorias.id, { onDelete: 'set null' }),
  costoUnitario: real('costo_unitario').notNull().default(0),
  precioMesa: real('precio_mesa').notNull().default(0),
  precioMostrador: real('precio_mostrador').notNull().default(0),
  stock: integer('stock').notNull().default(0),
  stockMinimo: integer('stock_minimo').notNull().default(5),
  codbarra: integer('codbarra'),
  imagen: text('imagen'),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
  sucursalId: integer('sucursal_id').references(() => sucursales.id),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});
