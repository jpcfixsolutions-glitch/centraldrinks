import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { client } from '../services/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function escaparCSV(valor) {
  if (valor === null || valor === undefined) return '';
  const str = String(valor);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function filaCSV(columnas) {
  return columnas.map(escaparCSV).join(',');
}

async function run() {
  console.log('[exportar-ventas] Consultando datos en Turso...');

  // --- VENTAS ---
  const { rows: ventas } = await client.execute(`
    SELECT
      v.id,
      v.codigo,
      v.tipo,
      v.numero_mesa,
      v.total,
      v.descuento,
      v.metodo_pago,
      u.nombre AS empleado,
      v.fecha
    FROM ventas v
    LEFT JOIN usuarios u ON u.id = v.usuario_id
    ORDER BY v.fecha ASC
  `);

  // --- ÍTEMS DE VENTA ---
  const { rows: items } = await client.execute(`
    SELECT
      vi.venta_id,
      vi.nombre_producto,
      vi.precio,
      vi.cantidad,
      (vi.precio * vi.cantidad) AS subtotal
    FROM venta_items vi
    ORDER BY vi.venta_id ASC
  `);

  // Agrupa ítems por venta_id
  const itemsPorVenta = {};
  for (const item of items) {
    const vid = item[0]; // venta_id
    if (!itemsPorVenta[vid]) itemsPorVenta[vid] = [];
    itemsPorVenta[vid].push(item);
  }

  // --- GASTOS VARIABLES ---
  const { rows: gastos } = await client.execute(`
    SELECT
      g.id,
      g.asunto,
      g.monto,
      g.metodo_pago,
      u.nombre AS empleado,
      g.fecha
    FROM gastos g
    LEFT JOIN usuarios u ON u.id = g.usuario_id
    ORDER BY g.fecha ASC
  `);

  // ==========================================================
  // Archivo 1: ventas_resumen.csv
  // ==========================================================
  const lineasVentas = [
    filaCSV(['ID', 'Código', 'Tipo', 'Mesa', 'Total', 'Descuento', 'Método de Pago', 'Empleado', 'Fecha'])
  ];
  for (const v of ventas) {
    lineasVentas.push(filaCSV([v[0], v[1], v[2], v[3] ?? '', v[4], v[5], v[6], v[7] ?? '', v[8]]));
  }
  const pathVentas = join(__dirname, '../../../../ventas_resumen.csv');
  writeFileSync(pathVentas, '\uFEFF' + lineasVentas.join('\n'), 'utf8');
  console.log(`[exportar-ventas] ✓ ventas_resumen.csv — ${ventas.length} ventas`);

  // ==========================================================
  // Archivo 2: ventas_items.csv
  // ==========================================================
  const lineasItems = [
    filaCSV(['ID Venta', 'Código Venta', 'Producto', 'Precio Unitario', 'Cantidad', 'Subtotal', 'Fecha Venta'])
  ];
  // Mapa código por id
  const codigoPorId = {};
  const fechaPorId = {};
  for (const v of ventas) {
    codigoPorId[v[0]] = v[1];
    fechaPorId[v[0]] = v[8];
  }
  for (const item of items) {
    const vid = item[0];
    lineasItems.push(filaCSV([vid, codigoPorId[vid] ?? '', item[1], item[2], item[3], item[4], fechaPorId[vid] ?? '']));
  }
  const pathItems = join(__dirname, '../../../../ventas_items.csv');
  writeFileSync(pathItems, '\uFEFF' + lineasItems.join('\n'), 'utf8');
  console.log(`[exportar-ventas] ✓ ventas_items.csv  — ${items.length} ítems`);

  // ==========================================================
  // Archivo 3: gastos_variables.csv
  // ==========================================================
  const lineasGastos = [
    filaCSV(['ID', 'Asunto', 'Monto', 'Método de Pago', 'Empleado', 'Fecha'])
  ];
  for (const g of gastos) {
    lineasGastos.push(filaCSV([g[0], g[1], g[2], g[3], g[4] ?? '', g[5]]));
  }
  const pathGastos = join(__dirname, '../../../../gastos_variables.csv');
  writeFileSync(pathGastos, '\uFEFF' + lineasGastos.join('\n'), 'utf8');
  console.log(`[exportar-ventas] ✓ gastos_variables.csv — ${gastos.length} gastos`);

  console.log('');
  console.log('[exportar-ventas] Archivos guardados en la raíz del proyecto:');
  console.log('  → ventas_resumen.csv');
  console.log('  → ventas_items.csv');
  console.log('  → gastos_variables.csv');
  console.log('');
  console.log('[exportar-ventas] Una vez que los verifiques en Excel, ejecutá:');
  console.log('  npm run db:reset-stats');

  process.exit(0);
}

run().catch((err) => {
  console.error('[exportar-ventas] Error:', err);
  process.exit(1);
});
