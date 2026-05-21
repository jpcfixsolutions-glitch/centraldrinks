import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

export const gastosFijos = sqliteTable('gastos_fijos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nombre: text('nombre').notNull(),
  monto: real('monto').notNull(),
});
