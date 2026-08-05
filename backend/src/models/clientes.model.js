import { sql } from 'drizzle-orm';
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sucursales } from './sucursales.model.js';

export const clientes = sqliteTable('clientes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nombre: text('nombre').notNull(),
  apellido: text('apellido').notNull(),
  documento: text('documento').notNull(),
  telefono: text('telefono').notNull(),
  sucursalId: integer('sucursal_id').references(() => sucursales.id),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});
