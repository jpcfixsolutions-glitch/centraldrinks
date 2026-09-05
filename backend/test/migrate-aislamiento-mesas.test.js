import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { createClient } from '@libsql/client';

const execFileAsync = promisify(execFile);
const testDir = dirname(fileURLToPath(import.meta.url));
const backendDir = dirname(testDir);
const tempDir = mkdtempSync(join(tmpdir(), 'centraldrinks-migration-'));
const dbPath = join(tempDir, 'test.db');
const dbUrl = `file:${dbPath}`;
const client = createClient({ url: dbUrl });

after(() => {
  client.close();
  rmSync(tempDir, { recursive: true, force: true });
});

test('repara usuarios y resguarda mesas/cuentas huérfanas', async () => {
  await client.executeMultiple(`
    CREATE TABLE sucursales (
      id INTEGER PRIMARY KEY,
      nombre TEXT NOT NULL,
      dominio TEXT NOT NULL UNIQUE
    );
    CREATE TABLE usuarios (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      nombre TEXT NOT NULL,
      rol TEXT NOT NULL,
      activo INTEGER NOT NULL DEFAULT 1,
      sucursal_id INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE mesas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero INTEGER NOT NULL,
      estado TEXT NOT NULL DEFAULT 'libre',
      activa INTEGER NOT NULL DEFAULT 1,
      sucursal_id INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(numero, sucursal_id)
    );
    CREATE TABLE mesa_cuentas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sucursal_id INTEGER,
      numero_mesa INTEGER NOT NULL,
      nombre_cliente TEXT,
      items_json TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX idx_mesa_cuentas_sucursal_numero
      ON mesa_cuentas(sucursal_id, numero_mesa);

    INSERT INTO sucursales VALUES
      (1, 'Tadeo Dávila', 'club22yofre'),
      (2, 'Roma', 'club22roma');
    INSERT INTO usuarios
      (id, username, password_hash, nombre, rol, activo, sucursal_id)
    VALUES
      (1, 'tadeo@club22yofre', 'hash', 'Tadeo', 'administrador', 1, NULL),
      (2, 'roma@club22roma', 'hash', 'Roma', 'administrador', 1, 2);
    INSERT INTO mesas (numero, estado, sucursal_id) VALUES
      (1, 'libre', 1),
      (2, 'ocupada', 1),
      (1, 'libre', 2),
      (50, 'ocupada', NULL);
    INSERT INTO mesa_cuentas (sucursal_id, numero_mesa, items_json) VALUES
      (1, 1, '[{"id":1,"nombre":"Tadeo","precio":10,"cantidad":1}]'),
      (2, 1, '[{"id":2,"nombre":"Roma","precio":20,"cantidad":1}]'),
      (1, 2, '[]'),
      (1, 99, '[{"id":3,"nombre":"Fantasma","precio":30,"cantidad":1}]'),
      (NULL, 50, '[{"id":4,"nombre":"Sin sede","precio":40,"cantidad":1}]');
  `);

  const ejecutarMigracion = () =>
    execFileAsync(process.execPath, ['src/db/migrate-aislamiento-mesas.js'], {
      cwd: backendDir,
      env: {
        ...process.env,
        TURSO_DATABASE_URL: dbUrl,
        TURSO_AUTH_TOKEN: '',
      },
    });

  await ejecutarMigracion();
  await ejecutarMigracion();

  const usuarios = await client.execute(
    'SELECT username, sucursal_id FROM usuarios ORDER BY id'
  );
  assert.deepEqual(
    usuarios.rows.map((row) => [row.username, Number(row.sucursal_id)]),
    [
      ['tadeo@club22yofre', 1],
      ['roma@club22roma', 2],
    ]
  );

  const mesas = await client.execute(
    'SELECT numero, estado, sucursal_id FROM mesas ORDER BY sucursal_id, numero'
  );
  assert.deepEqual(
    mesas.rows.map((row) => [Number(row.numero), row.estado, Number(row.sucursal_id)]),
    [
      [1, 'ocupada', 1],
      [2, 'libre', 1],
      [1, 'ocupada', 2],
    ]
  );

  const cuentas = await client.execute(
    'SELECT numero_mesa, sucursal_id FROM mesa_cuentas ORDER BY sucursal_id'
  );
  assert.deepEqual(
    cuentas.rows.map((row) => [Number(row.numero_mesa), Number(row.sucursal_id)]),
    [
      [1, 1],
      [1, 2],
    ]
  );

  const mesasArchivadas = await client.execute(
    'SELECT numero, motivo FROM mesas_aislamiento_huerfanas'
  );
  assert.equal(mesasArchivadas.rows.length, 1);
  assert.equal(Number(mesasArchivadas.rows[0].numero), 50);

  const cuentasArchivadas = await client.execute(
    'SELECT numero_mesa, motivo FROM mesa_cuentas_aislamiento_huerfanas ORDER BY numero_mesa'
  );
  assert.deepEqual(
    cuentasArchivadas.rows.map((row) => Number(row.numero_mesa)),
    [2, 50, 99]
  );

  await assert.rejects(
    () => client.execute("INSERT INTO mesas (numero, sucursal_id) VALUES (8, NULL)"),
    /requiere una sede válida/
  );
  await assert.rejects(
    () =>
      client.execute(
        "INSERT INTO mesa_cuentas (sucursal_id, numero_mesa, items_json) VALUES (1, 99, '[]')"
      ),
    /requiere una mesa válida/
  );
});
