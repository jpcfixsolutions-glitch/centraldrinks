import 'dotenv/config';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../models/index.js';

const url = process.env.TURSO_DATABASE_URL;

if (!url) {
  throw new Error('TURSO_DATABASE_URL no está definido. Revisa tu .env');
}

export const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
export { schema };
