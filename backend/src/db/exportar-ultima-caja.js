import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';
import { client } from '../services/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function run() {
  // ── 1. Obtener la última caja registrada ──────────────────────────────────
  const { rows: cajaRows } = await client.execute(`
    SELECT id, caja, empleado, efectivo_inicial, fecha_apertura, fecha_cierre,
           cantidad_ventas, ingreso_total, ingreso_efectivo, ingreso_virtual, egreso_efectivo
    FROM cierres_caja
    ORDER BY id DESC
    LIMIT 1
  `);

  if (cajaRows.length === 0) {
    console.error('[exportar-ultima-caja] No hay registros de caja en la base de datos.');
    process.exit(1);
  }

  const caja = cajaRows[0];
  const cajaId   = caja[0];
  const cajaNombre    = caja[1];
  const cajaEmpleado  = caja[2];
  const fechaApertura = caja[4];
  const fechaCierre   = caja[5] ?? 'Aún abierta';

  console.log(`[exportar-ultima-caja] Última caja encontrada:`);
  console.log(`  ID          : ${cajaId}`);
  console.log(`  Nombre      : ${cajaNombre}`);
  console.log(`  Empleado    : ${cajaEmpleado}`);
  console.log(`  Apertura    : ${fechaApertura}`);
  console.log(`  Cierre      : ${fechaCierre}`);
  console.log('');

  // ── 2. Ventas de esa caja ─────────────────────────────────────────────────
  const { rows: ventaRows } = await client.execute({
    sql: `SELECT id, codigo, tipo, numero_mesa, total, descuento, metodo_pago, fecha
          FROM ventas WHERE cierre_caja_id = ? ORDER BY fecha ASC`,
    args: [cajaId],
  });

  console.log(`[exportar-ultima-caja] Ventas encontradas: ${ventaRows.length}`);

  if (ventaRows.length === 0) {
    console.log('[exportar-ultima-caja] La caja no tiene ventas asociadas. Se eliminará el registro igualmente.');
  }

  const ventaIds = ventaRows.map(v => v[0]);

  // ── 3. Ítems de esas ventas ───────────────────────────────────────────────
  let itemRows = [];
  if (ventaIds.length > 0) {
    const placeholders = ventaIds.map(() => '?').join(',');
    const { rows } = await client.execute({
      sql: `SELECT vi.venta_id, vi.nombre_producto, vi.precio, vi.cantidad,
                   (vi.precio * vi.cantidad) AS subtotal
            FROM venta_items vi
            WHERE vi.venta_id IN (${placeholders})
            ORDER BY vi.venta_id ASC, vi.nombre_producto ASC`,
      args: ventaIds,
    });
    itemRows = rows;
  }

  // ── 4. Pagos de esas ventas ───────────────────────────────────────────────
  let pagoRows = [];
  if (ventaIds.length > 0) {
    const placeholders = ventaIds.map(() => '?').join(',');
    const { rows } = await client.execute({
      sql: `SELECT vp.venta_id, vp.metodo_pago, vp.monto, vp.recargo
            FROM venta_pagos vp
            WHERE vp.venta_id IN (${placeholders})
            ORDER BY vp.venta_id ASC`,
      args: ventaIds,
    });
    pagoRows = rows;
  }

  // ── 5. Agrupar productos: suma cantidades y subtotales ────────────────────
  const productosMap = {};
  for (const item of itemRows) {
    const nombre   = item[1];
    const precio   = Number(item[2]);
    const cantidad = Number(item[3]);
    const subtotal = Number(item[4]);
    if (!productosMap[nombre]) {
      productosMap[nombre] = { producto: nombre, precioUnitario: precio, cantidadTotal: 0, subtotal: 0 };
    }
    productosMap[nombre].cantidadTotal += cantidad;
    productosMap[nombre].subtotal      += subtotal;
  }
  const productosResumen = Object.values(productosMap).sort((a, b) =>
    a.producto.localeCompare(b.producto)
  );

  // ── 6. Agrupar pagos: suma por método de pago ─────────────────────────────
  const pagosMap = {};
  // Primero pagos divididos (venta_pagos)
  for (const pago of pagoRows) {
    const metodo = pago[1];
    const monto  = Number(pago[2]);
    if (!pagosMap[metodo]) pagosMap[metodo] = 0;
    pagosMap[metodo] += monto;
  }
  // También sumar ventas con método de pago simple (sin cobro dividido)
  const ventasConPagoDividido = new Set(pagoRows.map(p => p[0]));
  for (const v of ventaRows) {
    if (!ventasConPagoDividido.has(v[0])) {
      const metodo = v[6];
      const total  = Number(v[4]);
      if (!pagosMap[metodo]) pagosMap[metodo] = 0;
      pagosMap[metodo] += total;
    }
  }
  const pagosResumen = Object.entries(pagosMap).map(([metodo, total]) => ({
    metodoPago: metodo,
    totalRecaudado: total,
  }));

  // ── 7. Construir el Excel ─────────────────────────────────────────────────
  const wb = XLSX.utils.book_new();

  // Hoja 1 — Resumen de caja
  const resumenCaja = [
    ['Campo', 'Valor'],
    ['ID Caja', cajaId],
    ['Nombre', cajaNombre],
    ['Empleado', cajaEmpleado],
    ['Efectivo inicial', Number(caja[3])],
    ['Fecha apertura', fechaApertura],
    ['Fecha cierre', fechaCierre],
    ['Cantidad ventas', Number(caja[6])],
    ['Ingreso total', Number(caja[7])],
    ['Ingreso efectivo', Number(caja[8])],
    ['Ingreso virtual', Number(caja[9])],
    ['Egreso efectivo', Number(caja[10])],
  ];
  const wsResumen = XLSX.utils.aoa_to_sheet(resumenCaja);
  wsResumen['!cols'] = [{ wch: 20 }, { wch: 28 }];
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Caja');

  // Hoja 2 — Productos consumidos
  const productosData = [
    ['Producto', 'Precio Unitario ($)', 'Cantidad', 'Subtotal ($)'],
    ...productosResumen.map(p => [
      p.producto,
      p.precioUnitario,
      p.cantidadTotal,
      Number(p.subtotal.toFixed(2)),
    ]),
    [],
    ['', '', 'TOTAL', Number(productosResumen.reduce((s, p) => s + p.subtotal, 0).toFixed(2))],
  ];
  const wsProductos = XLSX.utils.aoa_to_sheet(productosData);
  wsProductos['!cols'] = [{ wch: 30 }, { wch: 22 }, { wch: 12 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, wsProductos, 'Productos Consumidos');

  // Hoja 3 — Pagos por método
  const pagosData = [
    ['Método de Pago', 'Total Recaudado ($)'],
    ...pagosResumen.map(p => [p.metodoPago, Number(p.totalRecaudado.toFixed(2))]),
    [],
    ['TOTAL', Number(pagosResumen.reduce((s, p) => s + p.totalRecaudado, 0).toFixed(2))],
  ];
  const wsPagos = XLSX.utils.aoa_to_sheet(pagosData);
  wsPagos['!cols'] = [{ wch: 22 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsPagos, 'Pagos por Método');

  // Hoja 4 — Detalle de ventas
  const ventasData = [
    ['ID', 'Código', 'Tipo', 'Mesa', 'Total ($)', 'Descuento ($)', 'Método de Pago', 'Fecha'],
    ...ventaRows.map(v => [
      v[0], v[1], v[2], v[3] ?? '-', Number(v[4]), Number(v[5]), v[6], v[7],
    ]),
  ];
  const wsVentas = XLSX.utils.aoa_to_sheet(ventasData);
  wsVentas['!cols'] = [{ wch: 6 }, { wch: 16 }, { wch: 12 }, { wch: 6 }, { wch: 12 }, { wch: 14 }, { wch: 20 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsVentas, 'Detalle Ventas');

  // ── 8. Guardar el archivo Excel ───────────────────────────────────────────
  const fecha = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const nombreArchivo = `caja_${cajaId}_${cajaNombre.replace(/\s+/g, '_')}_${fecha}.xlsx`;
  const rutaArchivo = join(__dirname, '../../../../', nombreArchivo);

  XLSX.writeFile(wb, rutaArchivo);
  console.log(`[exportar-ultima-caja] ✓ Excel generado: ${nombreArchivo}`);
  console.log(`  → ${rutaArchivo}`);
  console.log('');

  // ── 9. Eliminar el registro de la caja ────────────────────────────────────
  console.log(`[exportar-ultima-caja] Eliminando registro de caja ID ${cajaId}...`);
  await client.execute({
    sql: `DELETE FROM cierres_caja WHERE id = ?`,
    args: [cajaId],
  });
  console.log(`[exportar-ultima-caja] ✓ Registro de caja ID ${cajaId} eliminado correctamente.`);
  console.log('  (Las ventas asociadas conservan su historial con cierre_caja_id = NULL)');
  console.log('');
  console.log('[exportar-ultima-caja] Proceso completado.');

  process.exit(0);
}

run().catch((err) => {
  console.error('[exportar-ultima-caja] Error:', err);
  process.exit(1);
});
