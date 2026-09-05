import 'dotenv/config';
import { client } from '../services/db.js';

/**
 * Crea la tabla mesa_cuentas para sincronizar cuentas abiertas entre terminales.
 */
async function run() {
  console.log('[migrate-mesa-cuentas] Creando tabla mesa_cuentas...');

  await client.execute(`
    CREATE TABLE IF NOT EXISTS mesa_cuentas (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      sucursal_id    INTEGER NOT NULL REFERENCES sucursales(id),
      numero_mesa    INTEGER NOT NULL,
      nombre_cliente TEXT,
      items_json     TEXT    NOT NULL DEFAULT '[]',
      updated_at     TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  try {
    await client.execute(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_mesa_cuentas_sucursal_numero ON mesa_cuentas(sucursal_id, numero_mesa)'
    );
  } catch {
    // índice ya existe
  }

  try {
    await client.execute(
      'CREATE INDEX IF NOT EXISTS idx_mesa_cuentas_sucursal ON mesa_cuentas(sucursal_id)'
    );
  } catch {
    // índice ya existe
  }

  console.log('[migrate-mesa-cuentas] Listo.');
  process.exit(0);
}

run().catch((err) => {
  console.error('[migrate-mesa-cuentas] Error:', err);
  process.exit(1);
});
