import 'dotenv/config';
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const { rows: schema } = await client.execute(
  "SELECT sql FROM sqlite_master WHERE name='usuarios'"
);
console.log('SCHEMA:\n', schema[0][0]);
console.log();

const { rows } = await client.execute(
  'SELECT id, username, rol, sucursal_id, created_at FROM usuarios'
);
console.log('USUARIOS:');
rows.forEach((r) => console.log(r));
process.exit(0);
