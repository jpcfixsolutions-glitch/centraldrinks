import { sql } from 'drizzle-orm';
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sucursales } from './sucursales.model.js';

export const mesas = sqliteTable('mesas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  numero: integer('numero').notNull(),
  estado: text('estado', { enum: ['libre', 'ocupada', 'cerrando'] }).notNull().default('libre'),
  activa: integer('activa', { mode: 'boolean' }).notNull().default(true),
  sucursalId: integer('sucursal_id').notNull().references(() => sucursales.id),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});
