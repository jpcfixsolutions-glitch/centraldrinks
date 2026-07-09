/**
 * migrate-suscripcion.js
 *
 * Crea la tabla `suscripciones` y la cuenta del creador si no existen.
 * Es idempotente: se puede ejecutar varias veces sin romper nada.
 *
 * Uso:
 *   cd backend
 *   pnpm run db:migrate-suscripcion
 */
import 'dotenv/config';
import { createClient } from '@libsql/client';
import { hashPassword } from '../services/hash.js';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// ── Credenciales del creador ────────────────────────────────────────────────
const CREADOR_USERNAME = process.env.CREADOR_USERNAME ?? 'creador';
const CREADOR_PASSWORD = process.env.CREADOR_PASSWORD ?? 'CentralDrinks2024!';
const CREADOR_NOMBRE   = 'Creador';

async function run() {
  console.log('[migrate-suscripcion] Iniciando...\n');

  // 0. Ampliar el CHECK constraint de rol en usuarios para incluir 'creador'
  //    SQLite no permite ALTER COLUMN: se reconstruye la tabla preservando datos.
  console.log('[0/3] Verificando constraint de rol en usuarios...');
  const { rows: tablaInfo } = await client.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='usuarios'");
  const tablaSql = tablaInfo[0]?.[0] ?? tablaInfo[0]?.sql ?? '';
  if (tablaSql.includes("'creador'")) {
    console.log("  · El constraint ya incluye 'creador' (sin cambios)");
  } else {
    // Reconstruir la tabla usuarios con el nuevo CHECK constraint.
    // usuarios_new se crea SIN cláusula REFERENCES para evitar fallos de FK
    // durante el INSERT cuando FK checking está activo en Turso.
    // SQLite no bloquea DROP TABLE de la tabla padre aunque haya hijos con FK.
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
    console.log("  ✓ Tabla usuarios reconstruida con CHECK(rol IN ('administrador','empleado','creador'))");
  }

  // 1. Crear tabla suscripciones
  await client.execute(`
    CREATE TABLE IF NOT EXISTS suscripciones (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      sucursal_id      INTEGER NOT NULL REFERENCES sucursales(id),
      dia_vencimiento  INTEGER NOT NULL DEFAULT 1,
      updated_at       TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(sucursal_id)
    )
  `);
  console.log('✓ Tabla suscripciones asegurada');

  // 2. Insertar fila inicial para cada sucursal existente (día 1 por defecto)
  const { rows: sucursales } = await client.execute('SELECT id, nombre FROM sucursales');
  for (const s of sucursales) {
    const sucursalId = s[0] ?? s.id;
    const nombre     = s[1] ?? s.nombre;
    await client.execute({
      sql: `INSERT OR IGNORE INTO suscripciones (sucursal_id, dia_vencimiento) VALUES (?, 1)`,
      args: [sucursalId],
    });
    console.log(`  · Suscripción para sucursal "${nombre}" (id=${sucursalId}) asegurada`);
  }

  // 3. Crear usuario creador si no existe
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
    console.log(`\n✓ Cuenta creador creada`);
    console.log(`  usuario  : ${CREADOR_USERNAME}`);
    console.log(`  password : ${CREADOR_PASSWORD}`);
  } else {
    console.log('\n· Cuenta creador ya existe (sin cambios)');
  }

  console.log('\n[migrate-suscripcion] Listo.\n');
  process.exit(0);
}

run().catch((err) => {
  console.error('[migrate-suscripcion] Error:', err);
  process.exit(1);
});
