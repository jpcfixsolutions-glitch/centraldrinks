import 'dotenv/config';
import { client } from '../services/db.js';

async function run() {
  console.log('[migrate-cuentas-corrientes] Creando tablas...');

  await client.execute(`
    CREATE TABLE IF NOT EXISTS clientes (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre      TEXT    NOT NULL,
      apellido    TEXT    NOT NULL,
      documento   TEXT    NOT NULL,
      telefono    TEXT    NOT NULL,
      sucursal_id INTEGER REFERENCES sucursales(id),
      activo      INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
      created_at  TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS cuenta_movimientos (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id      INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
      tipo            TEXT    NOT NULL CHECK (tipo IN ('cargo', 'pago')),
      monto           REAL    NOT NULL,
      venta_id        INTEGER REFERENCES ventas(id) ON DELETE SET NULL,
      metodo_pago     TEXT,
      detalle         TEXT,
      cierre_caja_id  INTEGER REFERENCES cierres_caja(id) ON DELETE SET NULL,
      sucursal_id     INTEGER REFERENCES sucursales(id),
      usuario_id      INTEGER,
      fecha           TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  try {
    await client.execute(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_documento_sucursal ON clientes(documento, sucursal_id)'
    );
  } catch {
    // ya existe
  }

  try {
    await client.execute(
      'CREATE INDEX IF NOT EXISTS idx_cuenta_mov_cliente ON cuenta_movimientos(cliente_id)'
    );
  } catch {
    // ya existe
  }

  try {
    await client.execute(
      'CREATE INDEX IF NOT EXISTS idx_cuenta_mov_sucursal ON cuenta_movimientos(sucursal_id)'
    );
  } catch {
    // ya existe
  }

  try {
    await client.execute(
      'CREATE INDEX IF NOT EXISTS idx_cuenta_mov_cierre ON cuenta_movimientos(cierre_caja_id)'
    );
  } catch {
    // ya existe
  }

  console.log('[migrate-cuentas-corrientes] Listo.');
  process.exit(0);
}

run().catch((err) => {
  console.error('[migrate-cuentas-corrientes] Error:', err);
  process.exit(1);
});
