import { sql } from 'drizzle-orm';
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sucursales } from './sucursales.model.js';

// Una fila por sucursal. diaVencimiento: número 1-31 fijo para cada mes.
export const suscripciones = sqliteTable('suscripciones', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sucursalId: integer('sucursal_id').notNull().references(() => sucursales.id),
  diaVencimiento: integer('dia_vencimiento').notNull().default(1),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});
