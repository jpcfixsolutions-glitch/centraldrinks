/**
 * migrate-suscripcion.js  — idempotente
 *
 * 1. Amplía el CHECK constraint de usuarios para incluir 'creador'
 * 2. Crea la tabla `suscripciones` (fila única global, sin sucursal)
 * 3. Crea la cuenta creador si no existe
 *
 * Uso:
 *   cd backend && pnpm run db:migrate-suscripcion
 */
import 'dotenv/config';
import { createClient } from '@libsql/client';
import { hashPassword } from '../services/hash.js';
import { calcularProximaFecha } from '../services/suscripcion.service.js';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const CREADOR_USERNAME = process.env.CREADOR_USERNAME ?? 'creador';
const CREADOR_PASSWORD = process.env.CREADOR_PASSWORD ?? 'CentralDrinks2024!';
const CREADOR_NOMBRE   = 'Creador';

async function run() {
  console.log('[migrate-suscripcion] Iniciando...\n');

  // ── 0. Ampliar CHECK constraint de rol en usuarios ──────────────────────
  console.log('[0/3] Verificando constraint de rol en usuarios...');
  const { rows: tablaInfo } = await client.execute(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name='usuarios'"
  );
  const tablaSql = tablaInfo[0]?.[0] ?? tablaInfo[0]?.sql ?? '';

  if (tablaSql.includes("'creador'")) {
    console.log("  · El constraint ya incluye 'creador' (sin cambios)");
  } else {
    await client.batch([
      {
        sql: `CREATE TABLE usuarios_new (
          id            INTEGER PRIMARY KEY AUTOINCREMENT,
          username      TEXT    NOT NULL UNIQUE,
          password_hash TEXT    NOT NULL,
          nombre        TEXT    NOT NULL,
          rol           TEXT    NOT NULL DEFAULT 'empleado'
                        CHECK (rol IN ('administrador', 'empleado', 'creador')),
          activo        INTEGER NOT NULL DEFAULT 1
                        CHECK (activo IN (0, 1)),
          sucursal_id   INTEGER,
          created_at    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
        args: [],
      },
      { sql: `INSERT INTO usuarios_new SELECT * FROM usuarios`, args: [] },
      { sql: `DROP TABLE usuarios`, args: [] },
      { sql: `ALTER TABLE usuarios_new RENAME TO usuarios`, args: [] },
    ], 'write');
    console.log("  ✓ Tabla usuarios actualizada con CHECK rol 'creador'");
  }

  // ── 1. Crear tabla suscripciones (fila única global) ───────────────────
  console.log('\n[1/3] Asegurando tabla suscripciones...');

  // Eliminar la tabla vieja (con sucursal_id) si existe
  const { rows: tablaVieja } = await client.execute(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name='suscripciones'"
  );
  const sqlVieja = tablaVieja[0]?.[0] ?? tablaVieja[0]?.sql ?? '';
  const tieneColumnaVieja = sqlVieja.includes('sucursal_id');

  if (tieneColumnaVieja) {
    await client.execute('DROP TABLE IF EXISTS suscripciones');
    console.log('  · Tabla antigua (con sucursal_id) eliminada');
  }

  await client.execute(`
    CREATE TABLE IF NOT EXISTS suscripciones (
      id                INTEGER PRIMARY KEY,
      dia_vencimiento   INTEGER NOT NULL DEFAULT 1,
      fecha_vencimiento TEXT    NOT NULL DEFAULT '2099-12-31',
      updated_at        TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('  ✓ Tabla suscripciones asegurada');

  // Insertar la fila singleton si no existe
  const { rows: existeFila } = await client.execute(
    'SELECT id FROM suscripciones WHERE id = 1'
  );
  if (existeFila.length === 0) {
    const fechaDefault = calcularProximaFecha(1);
    await client.execute({
      sql: `INSERT INTO suscripciones (id, dia_vencimiento, fecha_vencimiento) VALUES (1, 1, ?)`,
      args: [fechaDefault],
    });
    console.log(`  · Fila inicial creada (día 1, próxima fecha: ${fechaDefault.slice(0, 10)})`);
  } else {
    console.log('  · Fila singleton ya existe (sin cambios)');
  }

  // ── 2. Crear usuario creador ─────────────────────────────────────────────
  console.log('\n[2/3] Verificando cuenta creador...');
  const { rows: existe } = await client.execute({
    sql: `SELECT id FROM usuarios WHERE username = ?`,
    args: [CREADOR_USERNAME],
  });

  if (existe.length === 0) {
    const hash = await hashPassword(CREADOR_PASSWORD);
    await client.execute({
      sql: `INSERT INTO usuarios (username, password_hash, nombre, rol, activo, sucursal_id)
            VALUES (?, ?, ?, 'creador', 1, NULL)`,
      args: [CREADOR_USERNAME, hash, CREADOR_NOMBRE],
    });
    console.log('  ✓ Cuenta creador creada');
    console.log(`    usuario  : ${CREADOR_USERNAME}`);
    console.log(`    password : ${CREADOR_PASSWORD}`);
  } else {
    console.log('  · Cuenta creador ya existe (sin cambios)');
  }

  console.log('\n[migrate-suscripcion] Listo.\n');
  process.exit(0);
}

run().catch((err) => {
  console.error('[migrate-suscripcion] Error:', err);
  process.exit(1);
});
