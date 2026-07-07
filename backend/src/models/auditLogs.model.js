import { sql } from 'drizzle-orm';
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { usuarios } from './usuarios.model.js';
import { sucursales } from './sucursales.model.js';

export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tipo: text('tipo').notNull(),
  mensaje: text('mensaje').notNull(),
  detalle: text('detalle'),
  usuarioId: integer('usuario_id').references(() => usuarios.id, { onDelete: 'set null' }),
  sucursalId: integer('sucursal_id').references(() => sucursales.id),
  fecha: text('fecha').notNull().default(sql`CURRENT_TIMESTAMP`),
});
