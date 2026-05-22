import 'dotenv/config';
import { client } from '../services/db.js';

async function run() {
  console.log('[fix-stock] Corrigiendo stock negativo...');
  const result = await client.execute('UPDATE productos SET stock = 0 WHERE stock < 0');
  console.log(`[fix-stock] Filas actualizadas: ${result.rowsAffected ?? 0}`);
  process.exit(0);
}

run().catch((err) => {
  console.error('[fix-stock] Error:', err);
  process.exit(1);
});
