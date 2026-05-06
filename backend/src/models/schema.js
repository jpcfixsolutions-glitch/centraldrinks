import { sql } from 'drizzle-orm';
import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

export const usuarios = sqliteTable('usuarios', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  nombre: text('nombre').notNull(),
  rol: text('rol', { enum: ['administrador', 'empleado'] }).notNull().default('empleado'),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const categorias = sqliteTable('categorias', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nombre: text('nombre').notNull().unique(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const metodosPago = sqliteTable('metodos_pago', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nombre: text('nombre').notNull().unique(),
  recargo: real('recargo').notNull().default(0),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const productos = sqliteTable('productos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nombre: text('nombre').notNull(),
  categoriaId: integer('categoria_id').references(() => categorias.id, { onDelete: 'set null' }),
  costoUnitario: real('costo_unitario').notNull().default(0),
  precioMesa: real('precio_mesa').notNull().default(0),
  precioMostrador: real('precio_mostrador').notNull().default(0),
  stock: integer('stock').notNull().default(0),
  imagen: text('imagen'),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const mesas = sqliteTable('mesas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  numero: integer('numero').notNull().unique(),
  estado: text('estado', { enum: ['libre', 'ocupada', 'cerrando'] }).notNull().default('libre'),
  activa: integer('activa', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const cierresCaja = sqliteTable('cierres_caja', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  caja: text('caja').notNull().default('Caja 01'),
  usuarioId: integer('usuario_id').references(() => usuarios.id, { onDelete: 'set null' }),
  empleado: text('empleado').notNull(),
  cantidadVentas: integer('cantidad_ventas').notNull().default(0),
  ingresoTotal: real('ingreso_total').notNull().default(0),
  fechaCierre: text('fecha_cierre').notNull().default(sql`CURRENT_TIMESTAMP`),
});

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

export const ventaItems = sqliteTable('venta_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ventaId: integer('venta_id').notNull().references(() => ventas.id, { onDelete: 'cascade' }),
  productoId: integer('producto_id').references(() => productos.id, { onDelete: 'set null' }),
  nombreProducto: text('nombre_producto').notNull(),
  precio: real('precio').notNull(),
  cantidad: integer('cantidad').notNull(),
});

export const ventaPagos = sqliteTable('venta_pagos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ventaId: integer('venta_id').notNull().references(() => ventas.id, { onDelete: 'cascade' }),
  metodoPago: text('metodo_pago').notNull(),
  monto: real('monto').notNull(),
  recargo: real('recargo').notNull().default(0),
});
