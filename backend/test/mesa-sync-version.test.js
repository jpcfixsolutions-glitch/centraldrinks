import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MESA_SYNC_VERSION,
  requireMesaSyncVersion,
} from '../src/middleware/mesaSync.js';

function createResponse() {
  return {
    statusCode: null,
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

test('bloquea escrituras de cuentas de mesa desde frontends anteriores', () => {
  const response = createResponse();
  let nextCalled = false;

  requireMesaSyncVersion(
    { get: () => undefined },
    response,
    () => {
      nextCalled = true;
    }
  );

  assert.equal(nextCalled, false);
  assert.equal(response.statusCode, 409);
  assert.match(response.body.error, /versión anterior/i);
});

test('permite escrituras de cuentas de mesa desde el frontend vigente', () => {
  const response = createResponse();
  let nextCalled = false;

  requireMesaSyncVersion(
    { get: (header) => (header === 'x-mesa-sync-version' ? MESA_SYNC_VERSION : undefined) },
    response,
    () => {
      nextCalled = true;
    }
  );

  assert.equal(nextCalled, true);
  assert.equal(response.statusCode, null);
});
