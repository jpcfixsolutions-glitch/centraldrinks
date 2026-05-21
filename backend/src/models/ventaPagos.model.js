import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { ventas } from './ventas.model.js';

export const ventaPagos = sqliteTable('venta_pagos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ventaId: integer('venta_id').notNull().references(() => ventas.id, { onDelete: 'cascade' }),
  metodoPago: text('metodo_pago').notNull(),
  monto: real('monto').notNull(),
  recargo: real('recargo').notNull().default(0),
});
