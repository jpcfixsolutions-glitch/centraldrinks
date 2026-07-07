import { relations } from 'drizzle-orm';
import { sucursales } from './sucursales.model.js';
import { usuarios } from './usuarios.model.js';
import { categorias } from './categorias.model.js';
import { productos } from './productos.model.js';
import { promocionItems } from './promocionItems.model.js';
import { cierresCaja } from './cierresCaja.model.js';
import { ventas } from './ventas.model.js';
import { ventaItems } from './ventaItems.model.js';
import { ventaPagos } from './ventaPagos.model.js';
import { gastos } from './gastos.model.js';
import { botellasBarra } from './botellasBarra.model.js';
import { auditLogs } from './auditLogs.model.js';

export const sucursalesRelations = relations(sucursales, ({ many }) => ({
  usuarios: many(usuarios),
  productos: many(productos),
  cierresCaja: many(cierresCaja),
  ventas: many(ventas),
  gastos: many(gastos),
  auditLogs: many(auditLogs),
}));

export const usuariosRelations = relations(usuarios, ({ one, many }) => ({
  sucursal: one(sucursales, { fields: [usuarios.sucursalId], references: [sucursales.id] }),
  ventas: many(ventas),
  cierresCaja: many(cierresCaja),
  gastos: many(gastos),
  auditLogs: many(auditLogs),
}));

export const categoriasRelations = relations(categorias, ({ many }) => ({
  productos: many(productos),
}));

export const productosRelations = relations(productos, ({ one, many }) => ({
  categoria: one(categorias, { fields: [productos.categoriaId], references: [categorias.id] }),
  sucursal: one(sucursales, { fields: [productos.sucursalId], references: [sucursales.id] }),
  ventaItems: many(ventaItems),
  botellasBarra: many(botellasBarra),
  componentesPromocion: many(promocionItems, { relationName: 'promocionComponentes' }),
  promocionesQueIncluyen: many(promocionItems, { relationName: 'productoEnPromocion' }),
}));

export const promocionItemsRelations = relations(promocionItems, ({ one }) => ({
  promocion: one(productos, {
    fields: [promocionItems.promocionId],
    references: [productos.id],
    relationName: 'promocionComponentes',
  }),
  producto: one(productos, {
    fields: [promocionItems.productoId],
    references: [productos.id],
    relationName: 'productoEnPromocion',
  }),
}));

export const cierresCajaRelations = relations(cierresCaja, ({ one, many }) => ({
  usuario: one(usuarios, { fields: [cierresCaja.usuarioId], references: [usuarios.id] }),
  sucursal: one(sucursales, { fields: [cierresCaja.sucursalId], references: [sucursales.id] }),
  ventas: many(ventas),
}));

export const ventasRelations = relations(ventas, ({ one, many }) => ({
  usuario: one(usuarios, { fields: [ventas.usuarioId], references: [usuarios.id] }),
  cierreCaja: one(cierresCaja, { fields: [ventas.cierreCajaId], references: [cierresCaja.id] }),
  sucursal: one(sucursales, { fields: [ventas.sucursalId], references: [sucursales.id] }),
  items: many(ventaItems),
  pagos: many(ventaPagos),
}));

export const ventaItemsRelations = relations(ventaItems, ({ one }) => ({
  venta: one(ventas, { fields: [ventaItems.ventaId], references: [ventas.id] }),
  producto: one(productos, { fields: [ventaItems.productoId], references: [productos.id] }),
}));

export const ventaPagosRelations = relations(ventaPagos, ({ one }) => ({
  venta: one(ventas, { fields: [ventaPagos.ventaId], references: [ventas.id] }),
}));

export const gastosRelations = relations(gastos, ({ one }) => ({
  usuario: one(usuarios, { fields: [gastos.usuarioId], references: [usuarios.id] }),
  sucursal: one(sucursales, { fields: [gastos.sucursalId], references: [sucursales.id] }),
}));

export const botellasBarraRelations = relations(botellasBarra, ({ one }) => ({
  producto: one(productos, { fields: [botellasBarra.productoId], references: [productos.id] }),
  sucursal: one(sucursales, { fields: [botellasBarra.sucursalId], references: [sucursales.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  usuario: one(usuarios, { fields: [auditLogs.usuarioId], references: [usuarios.id] }),
  sucursal: one(sucursales, { fields: [auditLogs.sucursalId], references: [sucursales.id] }),
}));
