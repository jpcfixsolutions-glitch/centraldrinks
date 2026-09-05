import { sql } from 'drizzle-orm';
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sucursales } from './sucursales.model.js';

export const mesaCuentas = sqliteTable('mesa_cuentas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sucursalId: integer('sucursal_id').notNull().references(() => sucursales.id),
  numeroMesa: integer('numero_mesa').notNull(),
  nombreCliente: text('nombre_cliente'),
  itemsJson: text('items_json').notNull().default('[]'),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});
