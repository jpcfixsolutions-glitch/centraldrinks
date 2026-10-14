import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { join } from 'node:path';

const dbPath = join(process.cwd(), 'test', `.comandas-${process.pid}.db`);
process.env.TURSO_DATABASE_URL = `file:${dbPath}`;
process.env.TURSO_AUTH_TOKEN = '';

const { client } = await import('../src/services/db.js');
const mesaCuentasService = await import('../src/services/mesaCuentas.service.js');

const pendiente = {
  id: 10,
  uid: 'item-1',
  nombre: 'Hamburguesa',
  precio: 100,
  cantidad: 1,
  estado: 'pendiente',
  observaciones: 'sin sal',
};

before(async () => {
  await client.executeMultiple(`
    CREATE TABLE sucursales (id INTEGER PRIMARY KEY, nombre TEXT NOT NULL, dominio TEXT NOT NULL UNIQUE);
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
    CREATE UNIQUE INDEX idx_mesa_cuentas_sucursal_numero ON mesa_cuentas(sucursal_id, numero_mesa);
    INSERT INTO sucursales (id, nombre, dominio) VALUES (1, 'Test', 'test');
    INSERT INTO mesas (numero, sucursal_id) VALUES (1, 1);
  `);
});

beforeEach(async () => {
  await client.execute('DELETE FROM mesa_cuentas');
  await client.execute("UPDATE mesas SET estado = 'libre'");
});

after(() => {
  client.close();
  try {
    rmSync(dbPath, { force: true, maxRetries: 3, retryDelay: 50 });
  } catch (error) {
    // Windows puede mantener el archivo abierto hasta que finaliza el worker.
    if (error.code !== 'EPERM') throw error;
  }
});

test('aplica la ronda completa y no permite cobrar antes de entregar', async () => {
  await mesaCuentasService.upsert(1, 1, { items: [pendiente], nombreCliente: 'Ana' });

  let cuenta = await mesaCuentasService.transicionarItems(1, 1, {
    accion: 'enviar',
    uids: ['item-1'],
    ronda: 1,
  });
  assert.equal(cuenta.items[0].estado, 'enviado');
  assert.equal(cuenta.items[0].ronda, 1);

  cuenta = await mesaCuentasService.transicionarItems(1, 1, { accion: 'recibir', ronda: 1 });
  assert.equal(cuenta.items[0].recibidoCocina, true);
  cuenta = await mesaCuentasService.transicionarItems(1, 1, { accion: 'listo', ronda: 1 });
  assert.equal(cuenta.items[0].estado, 'listo');
  cuenta = await mesaCuentasService.transicionarItems(1, 1, {
    accion: 'entregar',
    uids: ['item-1'],
  });
  assert.equal(cuenta.items[0].estado, 'entregado');
});

test('un PUT atrasado no revierte el estado controlado por cocina', async () => {
  await mesaCuentasService.upsert(1, 1, { items: [pendiente], nombreCliente: 'Ana' });
  await mesaCuentasService.transicionarItems(1, 1, {
    accion: 'enviar',
    uids: ['item-1'],
    ronda: 1,
  });
  await mesaCuentasService.transicionarItems(1, 1, { accion: 'listo', ronda: 1 });

  const cuenta = await mesaCuentasService.upsert(1, 1, {
    items: [{ ...pendiente, cantidad: 99 }],
    nombreCliente: 'Ana',
  });
  assert.equal(cuenta.items[0].estado, 'listo');
  assert.equal(cuenta.items[0].cantidad, 1);
});
