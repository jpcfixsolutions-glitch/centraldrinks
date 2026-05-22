import { sqliteTable, integer } from 'drizzle-orm/sqlite-core';
import { productos } from './productos.model.js';

export const promocionItems = sqliteTable('promocion_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  promocionId: integer('promocion_id')
    .notNull()
    .references(() => productos.id, { onDelete: 'cascade' }),
  productoId: integer('producto_id')
    .notNull()
    .references(() => productos.id, { onDelete: 'cascade' }),
  cantidad: integer('cantidad').notNull().default(1),
});
