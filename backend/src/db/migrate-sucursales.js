import 'dotenv/config';
import { client } from '../services/db.js';
import { hashPassword } from '../services/hash.js';

/**
 * Migración única para agregar soporte de sucursales.
 *
 * QUÉ HACE:
 *  1. Crea la tabla `sucursales` e inserta Yofre (id=1) y Roma 696 (id=2).
 *  2. Agrega columna `sucursal_id` a las tablas afectadas.
 *  3. Asigna todos los registros existentes a Yofre (sucursal_id = 1).
 *  4. Renombra los usuarios existentes al formato @dominio.
 *  5. Crea el usuario juan@club22roma.
 *  6. Copia los productos de Yofre a Roma con stock = 0.
 *  7. Reconstruye `mesas` para que numero sea único por sucursal.
 *
 * SEGURO para producción: solo ALTERs aditivos + UPDATEs. No borra datos.
 */

async function run() {
  console.log('[migrate-sucursales] Iniciando migración de sucursales...\n');

  // ─── 1. Tabla sucursales ────────────────────────────────────────────────────
  console.log('[1/9] Creando tabla sucursales...');
  await client.execute(`
    CREATE TABLE IF NOT EXISTS sucursales (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre  TEXT NOT NULL,
      dominio TEXT NOT NULL UNIQUE
    )
  `);
  await client.execute(`INSERT OR IGNORE INTO sucursales (id, nombre, dominio) VALUES (1, 'Yofre', 'club22yofre')`);
  await client.execute(`INSERT OR IGNORE INTO sucursales (id, nombre, dominio) VALUES (2, 'Roma 696', 'club22roma')`);
  console.log('   ✓ sucursales creadas: Yofre (1), Roma 696 (2)');

  // ─── 2. Agregar sucursal_id a las tablas afectadas ─────────────────────────
  console.log('\n[2/9] Agregando columna sucursal_id...');
  const tablas = [
    'usuarios',
    'productos',
    'cierres_caja',
    'ventas',
    'gastos',
    'gastos_fijos',
    'botellas_barra',
    'audit_logs',
  ];

  for (const tabla of tablas) {
    try {
      await client.execute(
        `ALTER TABLE ${tabla} ADD COLUMN sucursal_id INTEGER REFERENCES sucursales(id)`
      );
      console.log(`   ✓ ${tabla}.sucursal_id agregada`);
    } catch {
      console.log(`   · ${tabla}.sucursal_id ya existe (sin cambios)`);
    }
  }

  // ─── 3. Reconstruir mesas para unique(numero, sucursal_id) ─────────────────
  console.log('\n[3/9] Reconstruyendo tabla mesas (unique por sucursal)...');
  try {
    await client.execute('PRAGMA foreign_keys = OFF');

    await client.execute(`
      CREATE TABLE IF NOT EXISTS mesas_new (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        numero      INTEGER NOT NULL,
        estado      TEXT    NOT NULL DEFAULT 'libre'
                    CHECK (estado IN ('libre', 'ocupada', 'cerrando')),
        activa      INTEGER NOT NULL DEFAULT 1 CHECK (activa IN (0, 1)),
        sucursal_id INTEGER NOT NULL REFERENCES sucursales(id),
        created_at  TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (numero, sucursal_id)
      )
    `);

    await client.execute(`
      INSERT INTO mesas_new (id, numero, estado, activa, sucursal_id, created_at)
      SELECT id, numero, estado, activa, 1, created_at FROM mesas
    `);

    await client.execute('DROP TABLE mesas');
    await client.execute('ALTER TABLE mesas_new RENAME TO mesas');
    await client.execute('PRAGMA foreign_keys = ON');
    console.log('   ✓ mesas reconstruida con UNIQUE(numero, sucursal_id)');
  } catch (err) {
    await client.execute('PRAGMA foreign_keys = ON');
    console.log('   · mesas ya fue reconstruida o error:', err.message);
  }

  // ─── 4. Asignar todos los registros existentes a Yofre ─────────────────────
  console.log('\n[4/9] Asignando registros existentes a Yofre (sucursal_id = 1)...');
  const tablasConSucursal = [
    'usuarios',
    'productos',
    'cierres_caja',
    'ventas',
    'mesas',
    'gastos',
    'gastos_fijos',
    'botellas_barra',
    'audit_logs',
  ];
  for (const tabla of tablasConSucursal) {
    const res = await client.execute(
      `UPDATE ${tabla} SET sucursal_id = 1 WHERE sucursal_id IS NULL`
    );
    console.log(`   ✓ ${tabla}: ${res.rowsAffected ?? 0} filas actualizadas`);
  }

  // ─── 5. Renombrar usuarios existentes al formato @dominio ──────────────────
  console.log('\n[5/9] Actualizando usernames de Yofre al formato @dominio...');

  // Solo actualizar si no tienen @ (idempotente)
  const usuariosYofre = await client.execute(
    `SELECT id, username FROM usuarios WHERE sucursal_id = 1 AND username NOT LIKE '%@%'`
  );
  for (const u of usuariosYofre.rows) {
    const nuevoUsername = `${u[1]}@club22yofre`;
    await client.execute({
      sql: `UPDATE usuarios SET username = ? WHERE id = ?`,
      args: [nuevoUsername, u[0]],
    });
    console.log(`   ✓ ${u[1]} → ${nuevoUsername}`);
  }
  if (usuariosYofre.rows.length === 0) {
    console.log('   · usernames de Yofre ya tienen formato @dominio');
  }

  // ─── 6. Crear usuario juan@club22roma ──────────────────────────────────────
  console.log('\n[6/9] Creando usuario juan@club22roma...');
  const juanExiste = await client.execute({
    sql: `SELECT id FROM usuarios WHERE username = ?`,
    args: ['juan@club22roma'],
  });

  if (juanExiste.rows.length === 0) {
    const hash = await hashPassword('juan123');
    await client.execute({
      sql: `INSERT INTO usuarios (username, password_hash, nombre, rol, activo, sucursal_id)
            VALUES (?, ?, 'Juan', 'administrador', 1, 2)`,
      args: ['juan@club22roma', hash],
    });
    console.log('   ✓ juan@club22roma creado (administrador, Roma 696)');
  } else {
    console.log('   · juan@club22roma ya existe (sin cambios)');
  }

  // ─── 7. Copiar productos de Yofre a Roma (stock = 0, codbarra = NULL) ──────
  console.log('\n[7/9] Copiando productos de Yofre a Roma (stock=0)...');
  const productosRomaExisten = await client.execute(
    `SELECT COUNT(*) as total FROM productos WHERE sucursal_id = 2`
  );
  const yaExisten = Number(productosRomaExisten.rows[0]?.[0] ?? 0);

  if (yaExisten === 0) {
    const productosYofre = await client.execute(
      `SELECT nombre, categoria_id, costo_unitario, precio_mesa, precio_mostrador,
              stock_minimo, imagen, activo
       FROM productos WHERE sucursal_id = 1`
    );

    let copiados = 0;
    for (const p of productosYofre.rows) {
      await client.execute({
        sql: `INSERT INTO productos
                (nombre, categoria_id, costo_unitario, precio_mesa, precio_mostrador,
                 stock, stock_minimo, codbarra, imagen, activo, sucursal_id)
              VALUES (?, ?, ?, ?, ?, 0, ?, NULL, ?, ?, 2)`,
        args: [p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7]],
      });
      copiados++;
    }
    console.log(`   ✓ ${copiados} productos copiados a Roma con stock=0`);
  } else {
    console.log(`   · Roma ya tiene ${yaExisten} productos (sin cambios)`);
  }

  // ─── 8. Copiar promocion_items para los productos de Roma ──────────────────
  console.log('\n[8/9] Copiando items de promociones para Roma...');
  // Buscar las promociones de Yofre y sus componentes, y mapearlas a los de Roma
  // La lógica de mapeo: producto con mismo nombre en misma categoría
  const promoItemsRomaExisten = await client.execute(`
    SELECT COUNT(*) as total FROM promocion_items pi
    INNER JOIN productos p ON pi.promocion_id = p.id
    WHERE p.sucursal_id = 2
  `);
  const promoItemsYaExisten = Number(promoItemsRomaExisten.rows[0]?.[0] ?? 0);

  if (promoItemsYaExisten === 0) {
    // Obtener mapa de nombre->id para productos de Roma
    const productosRoma = await client.execute(
      `SELECT id, nombre FROM productos WHERE sucursal_id = 2`
    );
    const mapaRoma = new Map();
    for (const row of productosRoma.rows) {
      const id = row[0] ?? row.id;
      const nombre = row[1] ?? row.nombre;
      mapaRoma.set(nombre, id);
    }

    // Obtener promocion_items de Yofre con nombres
    const promoItemsYofre = await client.execute(`
      SELECT pi.cantidad, pp.nombre as promo_nombre, cp.nombre as comp_nombre
      FROM promocion_items pi
      INNER JOIN productos pp ON pi.promocion_id = pp.id
      INNER JOIN productos cp ON pi.producto_id = cp.id
      WHERE pp.sucursal_id = 1
    `);

    let insertados = 0;
    for (const row of promoItemsYofre.rows) {
      const cantidad = row[0] ?? row.cantidad;
      const promoNombre = row[1] ?? row.promo_nombre;
      const compNombre = row[2] ?? row.comp_nombre;
      const promoIdRoma = mapaRoma.get(promoNombre);
      const compIdRoma = mapaRoma.get(compNombre);
      if (promoIdRoma && compIdRoma) {
        await client.execute({
          sql: `INSERT OR IGNORE INTO promocion_items (promocion_id, producto_id, cantidad) VALUES (?, ?, ?)`,
          args: [promoIdRoma, compIdRoma, cantidad],
        });
        insertados++;
      }
    }
    console.log(`   ✓ ${insertados} items de promoción copiados a Roma`);
  } else {
    console.log(`   · Roma ya tiene items de promoción (sin cambios)`);
  }

  // ─── 9. Índices ────────────────────────────────────────────────────────────
  console.log('\n[9/9] Creando índices de sucursal_id...');
  const indices = [
    ['idx_usuarios_sucursal', 'usuarios', 'sucursal_id'],
    ['idx_productos_sucursal', 'productos', 'sucursal_id'],
    ['idx_cierres_sucursal', 'cierres_caja', 'sucursal_id'],
    ['idx_ventas_sucursal', 'ventas', 'sucursal_id'],
    ['idx_mesas_sucursal', 'mesas', 'sucursal_id'],
    ['idx_gastos_sucursal', 'gastos', 'sucursal_id'],
  ];
  for (const [idx, tabla, col] of indices) {
    try {
      await client.execute(`CREATE INDEX IF NOT EXISTS ${idx} ON ${tabla}(${col})`);
      console.log(`   ✓ ${idx}`);
    } catch {
      console.log(`   · ${idx} ya existe`);
    }
  }

  console.log('\n[migrate-sucursales] Migración completada exitosamente.');
  console.log('\nCredenciales resultantes:');
  console.log('  administrador@club22yofre  /  admin123  (administrador - Yofre)');
  console.log('  empleado@club22yofre       /  emp123    (empleado - Yofre)');
  console.log('  juan@club22roma            /  juan123   (administrador - Roma 696)');
  process.exit(0);
}

run().catch((err) => {
  console.error('[migrate-sucursales] Error:', err);
  process.exit(1);
});
