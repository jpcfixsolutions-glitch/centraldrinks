import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '../services/db.js';
import { usuarios } from '../models/usuarios.model.js';
import { hashPassword } from '../services/hash.js';

const USUARIOS_INICIALES = [
  { username: 'admin', password: 'admin123', nombre: 'Administrador', rol: 'administrador' },
  { username: 'empleado', password: 'emp123', nombre: 'Empleado', rol: 'empleado' },
];

async function ensureUsuario({ username, password, nombre, rol }) {
  const existente = await db.query.usuarios.findFirst({
    where: eq(usuarios.username, username),
  });

  if (existente) {
    console.log(`  [usuarios] ${username} ya existe (sin cambios)`);
    return;
  }

  const passwordHash = await hashPassword(password);
  await db.insert(usuarios).values({ username, passwordHash, nombre, rol });
  console.log(`  [usuarios] ${username} creado (${rol})`);
}

async function run() {
  console.log('[seed-usuarios] Creando usuarios iniciales...');
  for (const u of USUARIOS_INICIALES) {
    await ensureUsuario(u);
  }
  console.log('[seed-usuarios] Listo.');
  console.log('');
  console.log('Credenciales:');
  console.log('  admin     -> admin123  (administrador)');
  console.log('  empleado  -> emp123    (empleado)');
  process.exit(0);
}

run().catch((err) => {
  console.error('[seed-usuarios] Error:', err);
  process.exit(1);
});
