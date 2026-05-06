import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '../services/db.js';
import { usuarios, categorias, metodosPago, mesas, productos } from '../models/schema.js';
import { hashPassword } from '../services/hash.js';

// Este script es complementario a `npm run db:migrate`.
// El migrate ya inserta los datos iniciales (definidos en src/db/schema.sql).
// Este seed sirve si querés cambiar los hashes de las contraseñas o
// agregar más datos de ejemplo desde JavaScript de forma idempotente.

async function ensureUsuario(username, password, nombre, rol) {
  const existente = await db.query.usuarios.findFirst({ where: eq(usuarios.username, username) });
  if (existente) {
    console.log(`  [usuarios] ${username} ya existe`);
    return;
  }
  const passwordHash = await hashPassword(password);
  await db.insert(usuarios).values({ username, passwordHash, nombre, rol });
  console.log(`  [usuarios] ${username} creado`);
}

async function ensureCategoria(nombre) {
  const existente = await db.query.categorias.findFirst({ where: eq(categorias.nombre, nombre) });
  if (!existente) {
    await db.insert(categorias).values({ nombre });
    console.log(`  [categorias] ${nombre} creada`);
  }
}

async function ensureMetodoPago(nombre, recargo) {
  const existente = await db.query.metodosPago.findFirst({ where: eq(metodosPago.nombre, nombre) });
  if (!existente) {
    await db.insert(metodosPago).values({ nombre, recargo });
    console.log(`  [metodos_pago] ${nombre} creado`);
  }
}

async function ensureMesa(numero) {
  const existente = await db.query.mesas.findFirst({ where: eq(mesas.numero, numero) });
  if (!existente) {
    await db.insert(mesas).values({ numero });
  }
}

async function run() {
  console.log('[seed] Asegurando datos iniciales...');

  await ensureUsuario('admin', 'admin123', 'Administrador', 'administrador');
  await ensureUsuario('empleado1', 'emp123', 'Empleado #1', 'empleado');
  await ensureUsuario('empleado2', 'emp123', 'Empleado #2', 'empleado');

  await ensureCategoria('Vinos');
  await ensureCategoria('Tapas');
  await ensureCategoria('Cervezas');
  await ensureCategoria('Promociones');

  await ensureMetodoPago('Efectivo', 0);
  await ensureMetodoPago('Transferencia', 0);
  await ensureMetodoPago('Tarjeta Débito', 5);
  await ensureMetodoPago('Tarjeta Crédito', 10);

  for (let i = 1; i <= 12; i++) {
    await ensureMesa(i);
  }
  console.log('  [mesas] 12 mesas verificadas');

  const productosCount = (await db.select().from(productos)).length;
  if (productosCount === 0) {
    const promocionesCat = await db.query.categorias.findFirst({ where: eq(categorias.nombre, 'Promociones') });
    const vinosCat = await db.query.categorias.findFirst({ where: eq(categorias.nombre, 'Vinos') });
    const ejemplos = [
      { nombre: 'Promo Absolut + 2 Speed XL', categoriaId: promocionesCat?.id, costoUnitario: 25000, precioMesa: 45000, precioMostrador: 30000, stock: 1000 },
      { nombre: 'Promo fernet + coca de 2l retornable', categoriaId: promocionesCat?.id, costoUnitario: 15000, precioMesa: 30000, precioMostrador: 20000, stock: 1000 },
      { nombre: 'Promo Skyy + 2 Speed', categoriaId: promocionesCat?.id, costoUnitario: 12000, precioMesa: 30000, precioMostrador: 15500, stock: 1000 },
      { nombre: 'Vino Santa Julia', categoriaId: vinosCat?.id, costoUnitario: 8000, precioMesa: 15000, precioMostrador: 11000, stock: 10 },
    ];
    for (const p of ejemplos) {
      await db.insert(productos).values(p);
    }
    console.log(`  [productos] ${ejemplos.length} productos de ejemplo creados`);
  } else {
    console.log(`  [productos] ya hay ${productosCount} productos`);
  }

  console.log('[seed] Listo.');
  process.exit(0);
}

run().catch((err) => {
  console.error('[seed] Error:', err);
  process.exit(1);
});
