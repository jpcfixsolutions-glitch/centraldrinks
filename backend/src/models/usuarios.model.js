import { sql } from 'drizzle-orm';
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sucursales } from './sucursales.model.js';

export const usuarios = sqliteTable('usuarios', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  nombre: text('nombre').notNull(),
  rol: text('rol', { enum: ['administrador', 'empleado', 'creador'] }).notNull().default('empleado'),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
  sucursalId: integer('sucursal_id').references(() => sucursales.id),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});
