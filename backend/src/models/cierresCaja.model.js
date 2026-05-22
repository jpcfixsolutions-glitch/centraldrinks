import { sql } from 'drizzle-orm';
import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { usuarios } from './usuarios.model.js';

export const cierresCaja = sqliteTable('cierres_caja', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  caja: text('caja').notNull().default('Caja 01'),
  usuarioId: integer('usuario_id').references(() => usuarios.id, { onDelete: 'set null' }),
  empleado: text('empleado').notNull(),
  efectivoInicial: real('efectivo_inicial').notNull().default(0),
  fechaApertura: text('fecha_apertura').notNull().default(sql`CURRENT_TIMESTAMP`),
  abierta: integer('abierta', { mode: 'boolean' }).notNull().default(false),
  cantidadVentas: integer('cantidad_ventas').notNull().default(0),
  ingresoTotal: real('ingreso_total').notNull().default(0),
  ingresoEfectivo: real('ingreso_efectivo').notNull().default(0),
  ingresoVirtual: real('ingreso_virtual').notNull().default(0),
  egresoEfectivo: real('egreso_efectivo').notNull().default(0),
  fechaCierre: text('fecha_cierre'),
});
