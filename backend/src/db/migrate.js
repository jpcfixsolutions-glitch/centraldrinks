import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { client } from '../services/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = join(__dirname, 'schema.sql');

async function run() {
  console.log(`[migrate] Leyendo ${SCHEMA_PATH}`);
  const sql = readFileSync(SCHEMA_PATH, 'utf8');

  console.log('[migrate] Aplicando schema en la base de datos...');
  await client.executeMultiple(sql);

  const migracionesCaja = [
    'ALTER TABLE cierres_caja ADD COLUMN efectivo_inicial REAL NOT NULL DEFAULT 0',
    'ALTER TABLE cierres_caja ADD COLUMN fecha_apertura TEXT',
    'ALTER TABLE cierres_caja ADD COLUMN abierta INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE cierres_caja ADD COLUMN ingreso_efectivo REAL NOT NULL DEFAULT 0',
    'ALTER TABLE cierres_caja ADD COLUMN ingreso_virtual REAL NOT NULL DEFAULT 0',
    'ALTER TABLE cierres_caja ADD COLUMN egreso_efectivo REAL NOT NULL DEFAULT 0',
  ];

  console.log('[migrate] Aplicando migraciones de caja...');
  for (const stmt of migracionesCaja) {
    try {
      await client.execute(stmt);
    } catch {
      // columna ya existe
    }
  }

  const categoriasIniciales = ['Vinos', 'Tapas', 'Cervezas', 'Bebidas', 'Promociones'];
  console.log('[migrate] Asegurando categorías iniciales...');
  for (const nombre of categoriasIniciales) {
    await client.execute({
      sql: 'INSERT OR IGNORE INTO categorias (nombre) VALUES (?)',
      args: [nombre],
    });
  }

  try {
    await client.execute(
      "UPDATE cierres_caja SET fecha_apertura = fecha_cierre WHERE fecha_apertura IS NULL AND fecha_cierre IS NOT NULL"
    );
    await client.execute('UPDATE cierres_caja SET abierta = 0 WHERE fecha_cierre IS NOT NULL');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_cierres_abierta ON cierres_caja(abierta)');
  } catch {
    // ignorar si falla
  }

  console.log('[migrate] Listo. Tablas e índices aplicados.');
  console.log('[migrate] Si falla "Abrir Caja", ejecutá: npm run db:migrate-caja');
  console.log('[migrate] Ejecutá npm run db:seed-usuarios para crear admin y empleado.');
  console.log('[migrate] Las categorías (incl. Promociones) se crean automáticamente.');
  process.exit(0);
}

run().catch((err) => {
  console.error('[migrate] Error:', err);
  process.exit(1);
});
