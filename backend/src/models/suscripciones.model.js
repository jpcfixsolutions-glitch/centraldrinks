import { sql } from 'drizzle-orm';
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

// Fila única (id=1). No está ligada a ninguna sucursal: es un único cliente.
// fechaVencimiento: fecha ISO concreta calculada al guardar. Persiste bloqueada
// hasta que el creador reactive manualmente (avanza al mes siguiente).
export const suscripciones = sqliteTable('suscripciones', {
  id: integer('id').primaryKey(),
  diaVencimiento: integer('dia_vencimiento').notNull().default(1),
  fechaVencimiento: text('fecha_vencimiento').notNull().default('2099-12-31'),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});
