import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { ventas } from './ventas.model.js';
import { productos } from './productos.model.js';

export const ventaItems = sqliteTable('venta_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ventaId: integer('venta_id').notNull().references(() => ventas.id, { onDelete: 'cascade' }),
  productoId: integer('producto_id').references(() => productos.id, { onDelete: 'set null' }),
  nombreProducto: text('nombre_producto').notNull(),
  precio: real('precio').notNull(),
  cantidad: integer('cantidad').notNull(),
});
