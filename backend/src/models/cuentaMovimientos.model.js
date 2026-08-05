import { sql } from 'drizzle-orm';
import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { clientes } from './clientes.model.js';
import { ventas } from './ventas.model.js';
import { sucursales } from './sucursales.model.js';
import { cierresCaja } from './cierresCaja.model.js';

export const cuentaMovimientos = sqliteTable('cuenta_movimientos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clienteId: integer('cliente_id')
    .notNull()
    .references(() => clientes.id, { onDelete: 'cascade' }),
  tipo: text('tipo', { enum: ['cargo', 'pago'] }).notNull(),
  monto: real('monto').notNull(),
  ventaId: integer('venta_id').references(() => ventas.id, { onDelete: 'set null' }),
  metodoPago: text('metodo_pago'),
  detalle: text('detalle'),
  cierreCajaId: integer('cierre_caja_id').references(() => cierresCaja.id, { onDelete: 'set null' }),
  sucursalId: integer('sucursal_id').references(() => sucursales.id),
  usuarioId: integer('usuario_id'),
  fecha: text('fecha').notNull().default(sql`CURRENT_TIMESTAMP`),
});
