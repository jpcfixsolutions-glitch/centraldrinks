import { sql } from 'drizzle-orm';
import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { usuarios } from './usuarios.model.js';
import { cierresCaja } from './cierresCaja.model.js';

export const ventas = sqliteTable('ventas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  codigo: text('codigo').notNull().unique(),
  tipo: text('tipo', { enum: ['mostrador', 'mesa'] }).notNull(),
  numeroMesa: integer('numero_mesa'),
  total: real('total').notNull(),
  descuento: real('descuento').notNull().default(0),
  metodoPago: text('metodo_pago').notNull(),
  usuarioId: integer('usuario_id').references(() => usuarios.id, { onDelete: 'set null' }),
  cierreCajaId: integer('cierre_caja_id').references(() => cierresCaja.id, { onDelete: 'set null' }),
  fecha: text('fecha').notNull().default(sql`CURRENT_TIMESTAMP`),
});
