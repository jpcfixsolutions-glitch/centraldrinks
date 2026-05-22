import 'dotenv/config';
import { client } from '../services/db.js';

async function run() {
  console.log('[reset-historial] Eliminando historial de movimientos y actividad del sistema...');

  const ventas = await client.execute('DELETE FROM ventas');
  const gastos = await client.execute('DELETE FROM gastos');
  const auditLogs = await client.execute('DELETE FROM audit_logs');

  console.log(`[reset-historial] Ventas eliminadas: ${ventas.rowsAffected ?? 0}`);
  console.log(`[reset-historial] Gastos variables eliminados: ${gastos.rowsAffected ?? 0}`);
  console.log(`[reset-historial] Logs de actividad eliminados: ${auditLogs.rowsAffected ?? 0}`);
  console.log('[reset-historial] Listo.');
  process.exit(0);
}

run().catch((err) => {
  console.error('[reset-historial] Error:', err);
  process.exit(1);
});
