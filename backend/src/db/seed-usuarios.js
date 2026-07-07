import 'dotenv/config';
import { db } from '../services/db.js';
import { usuarios } from '../models/usuarios.model.js';
import { sucursales } from '../models/sucursales.model.js';
import { hashPassword } from '../services/hash.js';

/**
 * Recrea los usuarios iniciales con el formato @dominio.
 * ADVERTENCIA: elimina todos los usuarios antes de recrearlos.
 * Para producción, preferí usar npm run db:migrate-sucursales (no borra datos).
 */

const SUCURSALES_INICIALES = [
  { id: 1, nombre: 'Yofre', dominio: 'club22yofre' },
  { id: 2, nombre: 'Roma 696', dominio: 'club22roma' },
];

const USUARIOS_INICIALES = [
  {
    username: 'administrador@club22yofre',
    password: 'admin123',
    nombre: 'Administrador',
    rol: 'administrador',
    sucursalDominio: 'club22yofre',
  },
  {
    username: 'empleado@club22yofre',
    password: 'emp123',
    nombre: 'Empleado',
    rol: 'empleado',
    sucursalDominio: 'club22yofre',
  },
  {
    username: 'juan@club22roma',
    password: 'juan123',
    nombre: 'Juan',
    rol: 'administrador',
    sucursalDominio: 'club22roma',
  },
];

async function run() {
  console.log('[seed-usuarios] Asegurando sucursales...');
  for (const s of SUCURSALES_INICIALES) {
    await db.insert(sucursales).values(s).onConflictDoNothing();
    console.log(`  [sucursales] ${s.nombre} (${s.dominio})`);
  }

  console.log('[seed-usuarios] Eliminando todos los usuarios...');
  await db.delete(usuarios);

  console.log('[seed-usuarios] Creando usuarios iniciales...');
  for (const usuario of USUARIOS_INICIALES) {
    const sucursal = SUCURSALES_INICIALES.find((s) => s.dominio === usuario.sucursalDominio);
    const passwordHash = await hashPassword(usuario.password);
    await db.insert(usuarios).values({
      username: usuario.username,
      passwordHash,
      nombre: usuario.nombre,
      rol: usuario.rol,
      sucursalId: sucursal?.id ?? null,
    });
    console.log(`  [usuarios] ${usuario.username} (${usuario.rol} - ${sucursal?.nombre ?? '?'})`);
  }

  console.log('[seed-usuarios] Listo.\n');
  console.log('Credenciales:');
  console.log('  administrador@club22yofre  /  admin123  (administrador - Yofre)');
  console.log('  empleado@club22yofre       /  emp123    (empleado - Yofre)');
  console.log('  juan@club22roma            /  juan123   (administrador - Roma 696)');
  process.exit(0);
}

run().catch((err) => {
  console.error('[seed-usuarios] Error:', err);
  process.exit(1);
});
