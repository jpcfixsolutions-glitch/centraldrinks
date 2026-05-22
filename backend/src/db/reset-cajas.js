import 'dotenv/config';
import { client } from '../services/db.js';

async function run() {
  console.log('[reset-cajas] Cerrando sesiones abiertas y eliminando registros de caja...');

  await client.execute('UPDATE cierres_caja SET abierta = 0 WHERE abierta = 1');
  const deleted = await client.execute('DELETE FROM cierres_caja');

  console.log(`[reset-cajas] Registros eliminados: ${deleted.rowsAffected ?? 0}`);
  console.log('[reset-cajas] Las ventas existentes conservan su historial (cierre_caja_id queda en NULL).');
  console.log('[reset-cajas] Listo. La caja arrancará cerrada hasta que alguien la abra manualmente.');
  process.exit(0);
}

run().catch((err) => {
  console.error('[reset-cajas] Error:', err);
  process.exit(1);
});
