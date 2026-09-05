import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const tempDir = mkdtempSync(join(tmpdir(), 'centraldrinks-auth-'));
process.env.TURSO_DATABASE_URL = `file:${join(tempDir, 'test.db')}`;
process.env.TURSO_AUTH_TOKEN = '';
process.env.JWT_SECRET = 'secreto-de-prueba-aislamiento';

const { client } = await import('../src/services/db.js');
const { signToken } = await import('../src/services/jwt.js');
const { requireAuth, requireSucursal } = await import('../src/middleware/auth.js');
const authService = await import('../src/services/auth.service.js');

before(async () => {
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
    CREATE TABLE suscripciones (
      id INTEGER PRIMARY KEY,
      dia_vencimiento INTEGER NOT NULL DEFAULT 1,
      fecha_vencimiento TEXT NOT NULL DEFAULT '2099-12-31',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    INSERT INTO sucursales VALUES
      (1, 'Tadeo Dávila', 'club22yofre'),
      (2, 'Roma', 'club22roma');
    INSERT INTO usuarios
      (id, username, password_hash, nombre, rol, activo, sucursal_id)
    VALUES
      (1, 'roma@club22roma', 'hash', 'Roma', 'administrador', 1, 2),
      (2, 'sin-sede', 'hash', 'Sin sede', 'administrador', 1, NULL),
      (3, 'tadeo@club22yofre', 'hash', 'Tadeo', 'administrador', 1, NULL),
      (4, 'no-mover@club22roma', 'hash', 'No mover', 'administrador', 1, 1);
    INSERT INTO suscripciones (id) VALUES (1);
  `);
});

after(() => {
  client.close();
  rmSync(tempDir, { recursive: true, force: true });
});

function crearRespuesta() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function autenticar(token) {
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = crearRespuesta();

  return new Promise((resolve, reject) => {
    requireAuth(req, res, (error) => {
      if (error) reject(error);
      else resolve({ req, res });
    });
  });
}

test('usa la sede actual de la base aunque el JWT tenga una sede vieja', async () => {
  const tokenViejo = signToken({
    sub: 1,
    username: 'roma@club22roma',
    rol: 'administrador',
    sucursalId: 1,
  });

  const { req } = await autenticar(tokenViejo);
  assert.equal(req.user.sucursalId, 2);
});

test('bloquea una ruta operativa cuando el usuario no tiene sede', async () => {
  const token = signToken({
    sub: 2,
    username: 'sin-sede',
    rol: 'administrador',
    sucursalId: null,
  });

  const { req } = await autenticar(token);
  const res = crearRespuesta();
  let continuo = false;
  requireSucursal(req, res, () => {
    continuo = true;
  });

  assert.equal(continuo, false);
  assert.equal(res.statusCode, 403);
  assert.match(res.body.error, /no tiene una sede válida/i);
});

test('autocorrige de forma inequívoca la sede usando el dominio del usuario', async () => {
  const user = await authService.me(3);
  assert.equal(user.sucursalId, 1);
  assert.equal(user.sucursalNombre, 'Tadeo Dávila');

  const fila = await client.execute('SELECT sucursal_id FROM usuarios WHERE id = 3');
  assert.equal(Number(fila.rows[0].sucursal_id), 1);
});

test('el dominio no puede mover un usuario que ya tiene una sede válida', async () => {
  const user = await authService.me(4);
  assert.equal(user.sucursalId, 1);

  const fila = await client.execute('SELECT sucursal_id FROM usuarios WHERE id = 4');
  assert.equal(Number(fila.rows[0].sucursal_id), 1);
});
