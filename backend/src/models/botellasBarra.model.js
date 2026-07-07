import { sql } from 'drizzle-orm';
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { productos } from './productos.model.js';
import { sucursales } from './sucursales.model.js';

export const botellasBarra = sqliteTable('botellas_barra', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productoId: integer('producto_id').references(() => productos.id, { onDelete: 'cascade' }),
  nombreProducto: text('nombre_producto').notNull(),
  sucursalId: integer('sucursal_id').references(() => sucursales.id),
  fechaApertura: text('fecha_apertura').notNull().default(sql`CURRENT_TIMESTAMP`),
});
