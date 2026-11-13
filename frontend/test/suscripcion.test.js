import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

let server;
let App;
let auth;
let store;

before(async () => {
  server = await createServer({
    root: fileURLToPath(new URL('..', import.meta.url)),
    configFile: false,
    esbuild: { jsx: 'automatic' },
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
    plugins: [{
      name: 'subscription-test-contexts',
      enforce: 'pre',
      resolveId(source) {
        if (source.endsWith('/hooks/useAuth.jsx') || source === 'test:auth') return '\0test:auth';
        if (source.endsWith('/hooks/useDataStore.jsx') || source === 'test:store') return '\0test:store';
      },
      load(id) {
        const hook = id === '\0test:auth' ? 'useAuth' : id === '\0test:store' ? 'useDataStore' : null;
        if (hook) return `
          let value;
          export function setValue(next) { value = next; }
          export function ${hook}() { return value; }
        `;
      },
    }],
  });
  ({ default: App } = await server.ssrLoadModule('/src/App.jsx'));
  auth = await server.ssrLoadModule('test:auth');
  store = await server.ssrLoadModule('test:store');
});

after(async () => {
  await server?.close();
});

function renderizar(rol, estado) {
  auth.setValue({
    user: {
      id: 1,
      username: 'usuario@club22yofre',
      nombre: 'Usuario de prueba',
      rol,
      sucursalId: rol === 'creador' ? null : 1,
      sucursalNombre: 'Yofre',
      suscripcion: {
        estado,
        diasRestantes: 0,
        fechaVencimiento: '2020-01-01T23:59:59.999Z',
      },
    },
    loading: false,
    logout() {},
  });
  store.setValue({
    loading: false,
    categorias: [],
    metodosPago: [],
    productos: [],
    mesas: [],
    ventas: [],
    cierres: [],
    gastosFijos: [],
    gastos: [],
    botellasBarra: [],
    auditLogs: [],
  });
  return renderToStaticMarkup(createElement(App));
}

test('el administrador queda bloqueado cuando la suscripción está vencida', () => {
  assert.match(renderizar('administrador', 'expirada'), /Suscripción Expirada/);
});

test('el administrador puede acceder con una suscripción activa', () => {
  const html = renderizar('administrador', 'activa');
  assert.doesNotMatch(html, /Suscripción Expirada/);
  assert.match(html, /title="Configuración"/);
  assert.match(html, /Yofre/);
});

test('el empleado sigue bloqueado cuando la suscripción está vencida', () => {
  assert.match(renderizar('empleado', 'expirada'), /Suscripción Expirada/);
});

test('el empleado puede acceder con una suscripción activa', () => {
  assert.doesNotMatch(renderizar('empleado', 'activa'), /Suscripción Expirada/);
});

test('el creador conserva el acceso al panel para reactivar una suscripción vencida', () => {
  const html = renderizar('creador', 'expirada');
  assert.match(html, /Panel de Creador/);
  assert.doesNotMatch(html, /Suscripción Expirada/);
});

test('el administrador conserva el aviso informativo antes del vencimiento', () => {
  assert.match(renderizar('administrador', 'por_vencer'), /La suscripción del servicio vence hoy/);
});
