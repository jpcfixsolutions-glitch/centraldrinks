import { sql } from 'drizzle-orm';
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { usuarios } from './usuarios.model.js';

export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tipo: text('tipo').notNull(),
  mensaje: text('mensaje').notNull(),
  detalle: text('detalle'),
  usuarioId: integer('usuario_id').references(() => usuarios.id, { onDelete: 'set null' }),
  fecha: text('fecha').notNull().default(sql`CURRENT_TIMESTAMP`),
});
