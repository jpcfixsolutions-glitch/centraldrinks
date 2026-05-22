import 'dotenv/config';
import { db } from '../services/db.js';
import { usuarios } from '../models/usuarios.model.js';
import { hashPassword } from '../services/hash.js';

const USUARIOS_INICIALES = [
  {
    username: 'administrador',
    password: 'admin123',
    nombre: 'Administrador',
    rol: 'administrador',
  },
  {
    username: 'empleado',
    password: 'emp123',
    nombre: 'Empleado',
    rol: 'empleado',
  },
];

async function run() {
  console.log('[seed-usuarios] Eliminando todos los usuarios...');
  await db.delete(usuarios);

  console.log('[seed-usuarios] Creando usuarios iniciales...');
  for (const usuario of USUARIOS_INICIALES) {
    const passwordHash = await hashPassword(usuario.password);
    await db.insert(usuarios).values({
      username: usuario.username,
      passwordHash,
      nombre: usuario.nombre,
      rol: usuario.rol,
    });
    console.log(`  [usuarios] ${usuario.username} creado (${usuario.rol})`);
  }

  console.log('[seed-usuarios] Listo.');
  console.log('');
  console.log('Credenciales:');
  console.log('  administrador -> admin123  (administrador)');
  console.log('  empleado      -> emp123    (empleado)');
  process.exit(0);
}

run().catch((err) => {
  console.error('[seed-usuarios] Error:', err);
  process.exit(1);
});
