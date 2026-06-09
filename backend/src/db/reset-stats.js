import 'dotenv/config';
import { client } from '../services/db.js';

async function run() {
  console.log('[reset-stats] Reseteando estadísticas financieras...');
  console.log('[reset-stats] Se conservan: productos, precios, cajas, gastos fijos.');
  console.log('');

  // Elimina los ítems primero (ON DELETE CASCADE debería hacerlo, pero por las dudas)
  const items = await client.execute('DELETE FROM venta_items');
  console.log(`[reset-stats] Ítems de venta eliminados: ${items.rowsAffected ?? 0}`);

  // Elimina pagos de venta
  const pagos = await client.execute('DELETE FROM venta_pagos');
  console.log(`[reset-stats] Pagos de venta eliminados: ${pagos.rowsAffected ?? 0}`);

  // Elimina las ventas
  const ventas = await client.execute('DELETE FROM ventas');
  console.log(`[reset-stats] Ventas eliminadas: ${ventas.rowsAffected ?? 0}`);

  // Elimina gastos variables (no toca gastos_fijos)
  const gastos = await client.execute('DELETE FROM gastos');
  console.log(`[reset-stats] Gastos variables eliminados: ${gastos.rowsAffected ?? 0}`);

  // Elimina logs de auditoría (registros de actividad)
  const logs = await client.execute('DELETE FROM audit_logs');
  console.log(`[reset-stats] Logs de actividad eliminados: ${logs.rowsAffected ?? 0}`);

  console.log('');
  console.log('[reset-stats] ✓ Listo. Balance Neto, Ingresos Totales y Costo de Reposición ahora en $0.');
  console.log('[reset-stats] Los productos, precios, cajas y gastos fijos no fueron tocados.');
  process.exit(0);
}

run().catch((err) => {
  console.error('[reset-stats] Error:', err);
  process.exit(1);
});
