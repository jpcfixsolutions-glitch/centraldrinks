import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { and, eq } from 'drizzle-orm';

const tempDir = mkdtempSync(join(tmpdir(), 'centraldrinks-mesas-'));
process.env.TURSO_DATABASE_URL = `file:${join(tempDir, 'test.db')}`;
process.env.TURSO_AUTH_TOKEN = '';

const { client, db } = await import('../src/services/db.js');
const { mesas } = await import('../src/models/mesas.model.js');
const { mesaCuentas } = await import('../src/models/mesaCuentas.model.js');
const mesasService = await import('../src/services/mesas.service.js');
const mesaCuentasService = await import('../src/services/mesaCuentas.service.js');

const itemTadeo = {
  id: 11,
  nombre: 'Vino Tadeo',
  precio: 100,
  cantidad: 1,
};

const itemRoma = {
  id: 22,
  nombre: 'Vino Roma',
  precio: 200,
  cantidad: 2,
};

before(async () => {
  await client.executeMultiple(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE sucursales (
      id INTEGER PRIMARY KEY,
      nombre TEXT NOT NULL,
      dominio TEXT NOT NULL UNIQUE
    );
    CREATE TABLE mesas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero INTEGER NOT NULL,
      estado TEXT NOT NULL DEFAULT 'libre',
      activa INTEGER NOT NULL DEFAULT 1,
      sucursal_id INTEGER NOT NULL REFERENCES sucursales(id),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(numero, sucursal_id)
    );
    CREATE TABLE mesa_cuentas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sucursal_id INTEGER NOT NULL REFERENCES sucursales(id),
      numero_mesa INTEGER NOT NULL,
      nombre_cliente TEXT,
      items_json TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX idx_mesa_cuentas_sucursal_numero
      ON mesa_cuentas(sucursal_id, numero_mesa);
  `);
});

beforeEach(async () => {
  await client.execute('DELETE FROM mesa_cuentas');
  await client.execute('DELETE FROM mesas');
  await client.execute('DELETE FROM sucursales');
  await client.execute(
    "INSERT INTO sucursales (id, nombre, dominio) VALUES (1, 'Tadeo Dávila', 'club22yofre'), (2, 'Roma', 'club22roma')"
  );
  await client.execute(`
    INSERT INTO mesas (numero, sucursal_id)
    VALUES (1, 1), (2, 1), (1, 2), (2, 2), (3, 2)
  `);
});

after(async () => {
  client.close();
  rmSync(tempDir, { recursive: true, force: true });
});

test('lista y numera las mesas de cada sede de forma independiente', async () => {
  assert.deepEqual(
    (await mesasService.listar(1)).map((mesa) => mesa.numero),
    [1, 2]
  );
  assert.deepEqual(
    (await mesasService.listar(2)).map((mesa) => mesa.numero),
    [1, 2, 3]
  );

  const nuevaTadeo = await mesasService.crear(1);
  const nuevaRoma = await mesasService.crear(2);
  assert.equal(nuevaTadeo.numero, 3);
  assert.equal(nuevaRoma.numero, 4);
  assert.equal(nuevaTadeo.sucursalId, 1);
  assert.equal(nuevaRoma.sucursalId, 2);
});

test('mantiene cuentas del mismo número separadas entre Tadeo Dávila y Roma', async () => {
  await mesaCuentasService.upsert(1, 1, {
    items: [itemTadeo],
    nombreCliente: 'Cliente Tadeo',
  });
  await mesaCuentasService.upsert(2, 1, {
    items: [itemRoma],
    nombreCliente: 'Cliente Roma',
  });

  const cuentasTadeo = await mesaCuentasService.listar(1);
  const cuentasRoma = await mesaCuentasService.listar(2);

  assert.equal(cuentasTadeo.length, 1);
  assert.equal(cuentasTadeo[0].nombreCliente, 'Cliente Tadeo');
  assert.deepEqual(cuentasTadeo[0].items, [itemTadeo]);
  assert.equal(cuentasRoma.length, 1);
  assert.equal(cuentasRoma[0].nombreCliente, 'Cliente Roma');
  assert.deepEqual(cuentasRoma[0].items, [itemRoma]);

  await mesaCuentasService.eliminar(1, 1);

  assert.deepEqual(await mesaCuentasService.listar(1), []);
  assert.equal((await mesaCuentasService.listar(2))[0].nombreCliente, 'Cliente Roma');

  const [mesaTadeo] = await db
    .select()
    .from(mesas)
    .where(and(eq(mesas.sucursalId, 1), eq(mesas.numero, 1)));
  const [mesaRoma] = await db
    .select()
    .from(mesas)
    .where(and(eq(mesas.sucursalId, 2), eq(mesas.numero, 1)));
  assert.equal(mesaTadeo.estado, 'libre');
  assert.equal(mesaRoma.estado, 'ocupada');
});

test('rechaza acceso global cuando falta la sede', async () => {
  await assert.rejects(() => mesasService.listar(null), { status: 403 });
  await assert.rejects(() => mesaCuentasService.listar(undefined), { status: 403 });
  await assert.rejects(
    () => mesaCuentasService.upsert(null, 1, { items: [itemTadeo] }),
    { status: 403 }
  );
});

test('no permite correlacionar una cuenta con una mesa que solo existe en otra sede', async () => {
  await assert.rejects(
    () => mesaCuentasService.upsert(1, 3, { items: [itemTadeo] }),
    { status: 404, message: 'La mesa no existe en esta sede' }
  );
  assert.deepEqual(await mesaCuentasService.listar(1), []);
});

test('oculta cuentas huérfanas y evita eliminar una mesa ocupada', async () => {
  await db.insert(mesaCuentas).values({
    sucursalId: 1,
    numeroMesa: 99,
    itemsJson: JSON.stringify([itemTadeo]),
  });
  assert.deepEqual(await mesaCuentasService.listar(1), []);

  await mesaCuentasService.upsert(1, 1, { items: [itemTadeo] });
  const mesaUnoTadeo = (await mesasService.listar(1)).find((mesa) => mesa.numero === 1);
  await assert.rejects(() => mesasService.eliminar(mesaUnoTadeo.id, 1), {
    status: 409,
  });

  const mesaUnoRoma = (await mesasService.listar(2)).find((mesa) => mesa.numero === 1);
  assert.equal(await mesasService.eliminar(mesaUnoRoma.id, 2), true);
});
