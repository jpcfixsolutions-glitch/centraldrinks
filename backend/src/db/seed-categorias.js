import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '../services/db.js';
import { categorias } from '../models/categorias.model.js';

const CATEGORIAS_INICIALES = [
  'Vinos',
  'Tapas',
  'Cervezas',
  'Bebidas',
  'Promociones',
];

async function ensureCategoria(nombre) {
  const existente = await db.query.categorias.findFirst({
    where: eq(categorias.nombre, nombre),
  });

  if (existente) {
    console.log(`  [categorias] ${nombre} ya existe (sin cambios)`);
    return;
  }

  await db.insert(categorias).values({ nombre });
  console.log(`  [categorias] ${nombre} creada`);
}

async function run() {
  console.log('[seed-categorias] Creando categorías iniciales...');
  for (const nombre of CATEGORIAS_INICIALES) {
    await ensureCategoria(nombre);
  }
  console.log('[seed-categorias] Listo.');
  process.exit(0);
}

run().catch((err) => {
  console.error('[seed-categorias] Error:', err);
  process.exit(1);
});
