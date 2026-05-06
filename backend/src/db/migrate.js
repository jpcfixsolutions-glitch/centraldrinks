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

  console.log('[migrate] Listo. Tablas, índices y datos iniciales aplicados.');
  process.exit(0);
}

run().catch((err) => {
  console.error('[migrate] Error:', err);
  process.exit(1);
});
