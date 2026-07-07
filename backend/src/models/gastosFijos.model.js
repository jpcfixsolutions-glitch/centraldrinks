import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { sucursales } from './sucursales.model.js';

export const gastosFijos = sqliteTable('gastos_fijos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nombre: text('nombre').notNull(),
  monto: real('monto').notNull(),
  sucursalId: integer('sucursal_id').references(() => sucursales.id),
});
