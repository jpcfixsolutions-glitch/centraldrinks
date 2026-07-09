/**
 * fix-usuarios-columnas.js
 *
 * Corrige el swap de columnas sucursal_id <-> created_at
 * causado por la migración anterior que usó SELECT * con diferente orden de columnas.
 *
 * Valores originales recuperados:
 *  id=3 (administrador@club22yofre): sucursal_id=1, created_at='2026-05-22 17:01:48'
 *  id=4 (empleado@club22yofre):      sucursal_id=1, created_at='2026-05-22 17:01:48'
 *  id=5 (juan@club22roma):           sucursal_id=2, created_at='2026-07-07 23:40:10'
 */
import 'dotenv/config';
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const correcciones = [
  { id: 3, sucursalId: 1,    createdAt: '2026-05-22 17:01:48' },
  { id: 4, sucursalId: 1,    createdAt: '2026-05-22 17:01:48' },
  { id: 5, sucursalId: 2,    createdAt: '2026-07-07 23:40:10' },
];

console.log('[fix-usuarios-columnas] Corrigiendo usuarios...\n');

for (const u of correcciones) {
  await client.execute({
    sql: `UPDATE usuarios SET sucursal_id = ?, created_at = ? WHERE id = ?`,
    args: [u.sucursalId, u.createdAt, u.id],
  });
  console.log(`  ✓ Usuario id=${u.id}: sucursal_id=${u.sucursalId}, created_at=${u.createdAt}`);
}

// Verificar resultado
const { rows } = await client.execute(
  'SELECT id, username, rol, sucursal_id, created_at FROM usuarios'
);
console.log('\nEstado final:');
rows.forEach((r) => console.log(' ', r));

console.log('\n[fix-usuarios-columnas] Listo.');
process.exit(0);
