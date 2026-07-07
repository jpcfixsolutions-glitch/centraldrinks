import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const sucursales = sqliteTable('sucursales', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nombre: text('nombre').notNull(),
  dominio: text('dominio').notNull().unique(),
});
