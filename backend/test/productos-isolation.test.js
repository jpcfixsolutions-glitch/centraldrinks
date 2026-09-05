import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';

const tempDir = mkdtempSync(join(tmpdir(), 'centraldrinks-productos-'));
process.env.TURSO_DATABASE_URL = `file:${join(tempDir, 'test.db')}`;
process.env.TURSO_AUTH_TOKEN = '';

const { client, db } = await import('../src/services/db.js');
const { productos } = await import('../src/models/productos.model.js');
const productosService = await import('../src/services/productos.service.js');

before(async () => {
  await client.executeMultiple(`
    CREATE TABLE sucursales (
      id INTEGER PRIMARY KEY,
      nombre TEXT NOT NULL,
      dominio TEXT NOT NULL UNIQUE
    );
    CREATE TABLE categorias (
      id INTEGER PRIMARY KEY,
      nombre TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      categoria_id INTEGER,
      costo_unitario REAL NOT NULL DEFAULT 0,
      precio_mesa REAL NOT NULL DEFAULT 0,
      precio_mostrador REAL NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      stock_minimo INTEGER NOT NULL DEFAULT 5,
      codbarra INTEGER,
      imagen TEXT,
      activo INTEGER NOT NULL DEFAULT 1,
      sucursal_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE promocion_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      promocion_id INTEGER NOT NULL,
      producto_id INTEGER NOT NULL,
      cantidad INTEGER NOT NULL DEFAULT 1
    );
    INSERT INTO sucursales VALUES
      (1, 'Tadeo Dávila', 'club22yofre'),
      (2, 'Roma', 'club22roma');
    INSERT INTO categorias (id, nombre) VALUES (1, 'Vinos'), (2, 'Promociones');
  `);
});

beforeEach(async () => {
  await client.execute('DELETE FROM promocion_items');
  await client.execute('DELETE FROM productos');
  await client.execute(`
    INSERT INTO productos (id, nombre, categoria_id, stock, sucursal_id) VALUES
      (1, 'Producto Tadeo', 1, 10, 1),
      (2, 'Producto Roma', 1, 20, 2),
      (3, 'Promo Roma', 2, 0, 2)
  `);
  await client.execute(
    'INSERT INTO promocion_items (promocion_id, producto_id, cantidad) VALUES (3, 2, 1)'
  );
});

after(() => {
  client.close();
  rmSync(tempDir, { recursive: true, force: true });
});

test('una venta no puede usar ni descontar stock de un producto de otra sede', async () => {
  const itemRoma = [{ productoId: 2, cantidad: 1 }];

  await assert.rejects(() => productosService.validarStockVenta(itemRoma, 1), {
    status: 400,
  });
  await assert.rejects(() => productosService.descontarStock(2, 1, 1), {
    status: 400,
  });

  const [productoRoma] = await db.select().from(productos).where(eq(productos.id, 2));
  assert.equal(productoRoma.stock, 20);
});

test('una sede no puede modificar promociones ni componentes de la otra', async () => {
  const resultado = await productosService.actualizar(
    3,
    { nombre: 'Intento cruzado', componentes: [] },
    1
  );
  assert.equal(resultado, null);

  const componentesRoma = await client.execute(
    'SELECT producto_id, cantidad FROM promocion_items WHERE promocion_id = 3'
  );
  assert.equal(componentesRoma.rows.length, 1);
  assert.equal(Number(componentesRoma.rows[0].producto_id), 2);
});

test('no crea una promoción con componentes pertenecientes a otra sede', async () => {
  await assert.rejects(
    () =>
      productosService.crear(
        {
          nombre: 'Promo inválida',
          categoriaId: 2,
          stock: 0,
          componentes: [{ productoId: 2, cantidad: 1 }],
        },
        1
      ),
    { status: 400, message: 'Todos los componentes deben pertenecer a la misma sede' }
  );

  const creadas = await client.execute(
    "SELECT COUNT(*) AS total FROM productos WHERE nombre = 'Promo inválida'"
  );
  assert.equal(Number(creadas.rows[0].total), 0);
});
