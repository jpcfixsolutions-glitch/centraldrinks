import { sql } from 'drizzle-orm';
import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { usuarios } from './usuarios.model.js';

export const gastos = sqliteTable('gastos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  asunto: text('asunto').notNull(),
  monto: real('monto').notNull(),
  metodoPago: text('metodo_pago', { enum: ['Efectivo', 'Virtual'] }).notNull(),
  usuarioId: integer('usuario_id').references(() => usuarios.id, { onDelete: 'set null' }),
  fecha: text('fecha').notNull().default(sql`CURRENT_TIMESTAMP`),
});
