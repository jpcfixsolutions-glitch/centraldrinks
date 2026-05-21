import 'dotenv/config';
import { client } from '../services/db.js';

/**
 * Reconstruye cierres_caja para permitir fecha_cierre NULL (caja abierta).
 * Necesario en bases creadas antes del cambio de sesiones de caja.
 */
async function run() {
  console.log('[migrate-caja] Reconstruyendo tabla cierres_caja...');

  await client.execute('PRAGMA foreign_keys = OFF');

  await client.execute(`
    CREATE TABLE IF NOT EXISTS cierres_caja_new (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      caja             TEXT    NOT NULL DEFAULT 'Caja 01',
      usuario_id       INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
      empleado         TEXT    NOT NULL,
      efectivo_inicial REAL    NOT NULL DEFAULT 0,
      fecha_apertura   TEXT    NOT NULL DEFAULT (datetime('now')),
      abierta          INTEGER NOT NULL DEFAULT 0 CHECK (abierta IN (0, 1)),
      cantidad_ventas  INTEGER NOT NULL DEFAULT 0,
      ingreso_total    REAL    NOT NULL DEFAULT 0,
      ingreso_efectivo REAL    NOT NULL DEFAULT 0,
      ingreso_virtual  REAL    NOT NULL DEFAULT 0,
      egreso_efectivo  REAL    NOT NULL DEFAULT 0,
      fecha_cierre     TEXT
    )
  `);

  await client.execute(`
    INSERT INTO cierres_caja_new (
      id, caja, usuario_id, empleado, efectivo_inicial, fecha_apertura, abierta,
      cantidad_ventas, ingreso_total, ingreso_efectivo, ingreso_virtual, egreso_efectivo, fecha_cierre
    )
    SELECT
      id,
      caja,
      usuario_id,
      empleado,
      COALESCE(efectivo_inicial, 0),
      COALESCE(fecha_apertura, fecha_cierre, datetime('now')),
      COALESCE(abierta, 0),
      cantidad_ventas,
      ingreso_total,
      COALESCE(ingreso_efectivo, 0),
      COALESCE(ingreso_virtual, 0),
      COALESCE(egreso_efectivo, 0),
      fecha_cierre
    FROM cierres_caja
  `);

  await client.execute('DROP TABLE cierres_caja');
  await client.execute('ALTER TABLE cierres_caja_new RENAME TO cierres_caja');

  await client.execute('CREATE INDEX IF NOT EXISTS idx_cierres_usuario ON cierres_caja(usuario_id)');
  await client.execute('CREATE INDEX IF NOT EXISTS idx_cierres_fecha ON cierres_caja(fecha_cierre)');
  await client.execute('CREATE INDEX IF NOT EXISTS idx_cierres_abierta ON cierres_caja(abierta)');

  await client.execute('PRAGMA foreign_keys = ON');

  console.log('[migrate-caja] Listo. fecha_cierre ahora permite NULL (caja abierta).');
  process.exit(0);
}

run().catch((err) => {
  console.error('[migrate-caja] Error:', err);
  process.exit(1);
});
