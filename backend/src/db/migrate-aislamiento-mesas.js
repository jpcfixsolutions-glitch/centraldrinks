import 'dotenv/config';
import { client } from '../services/db.js';

/**
 * Repara y blinda el aislamiento de mesas por sede.
 *
 * - Recupera la sede de usuarios operativos sin sede válida cuando el dominio
 *   del username coincide con `sucursales.dominio`.
 * - Resguarda y retira mesas/cuentas sin una sede válida.
 * - Resguarda y retira cuentas cuyo número de mesa no existe en su sede.
 * - Reconcilia el estado ocupado/libre con las cuentas abiertas reales.
 * - Agrega triggers para impedir que vuelvan a crearse datos huérfanos.
 */

function valor(row, nombre, posicion = 0) {
  return row?.[nombre] ?? row?.[posicion];
}

async function run() {
  console.log('[aislamiento-mesas] Iniciando auditoría y reparación...');

  const tx = await client.transaction('write');

  try {
    const usuariosCorregidos = await tx.execute(`
      UPDATE usuarios
      SET sucursal_id = (
        SELECT s.id
        FROM sucursales s
        WHERE lower(s.dominio) = lower(substr(usuarios.username, instr(usuarios.username, '@') + 1))
        LIMIT 1
      )
      WHERE rol <> 'creador'
        AND (
          sucursal_id IS NULL
          OR NOT EXISTS (SELECT 1 FROM sucursales actual WHERE actual.id = usuarios.sucursal_id)
        )
        AND instr(username, '@') > 0
        AND EXISTS (
          SELECT 1
          FROM sucursales s
          WHERE lower(s.dominio) = lower(substr(usuarios.username, instr(usuarios.username, '@') + 1))
        )
    `);

    await tx.execute(`
      CREATE TABLE IF NOT EXISTS mesas_aislamiento_huerfanas (
        id_original INTEGER NOT NULL,
        numero INTEGER NOT NULL,
        estado TEXT NOT NULL,
        activa INTEGER NOT NULL,
        sucursal_id INTEGER,
        created_at TEXT,
        motivo TEXT NOT NULL,
        archivado_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await tx.execute(`
      CREATE TABLE IF NOT EXISTS mesa_cuentas_aislamiento_huerfanas (
        id_original INTEGER NOT NULL,
        sucursal_id INTEGER,
        numero_mesa INTEGER NOT NULL,
        nombre_cliente TEXT,
        items_json TEXT NOT NULL,
        updated_at TEXT,
        motivo TEXT NOT NULL,
        archivado_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const cuentasSinSede = await tx.execute(`
      INSERT INTO mesa_cuentas_aislamiento_huerfanas
        (id_original, sucursal_id, numero_mesa, nombre_cliente, items_json, updated_at, motivo)
      SELECT mc.id, mc.sucursal_id, mc.numero_mesa, mc.nombre_cliente, mc.items_json, mc.updated_at,
             'Cuenta sin sede válida'
      FROM mesa_cuentas mc
      LEFT JOIN sucursales s ON s.id = mc.sucursal_id
      WHERE mc.sucursal_id IS NULL OR s.id IS NULL
    `);
    await tx.execute(`
      DELETE FROM mesa_cuentas
      WHERE sucursal_id IS NULL
         OR NOT EXISTS (SELECT 1 FROM sucursales s WHERE s.id = mesa_cuentas.sucursal_id)
    `);

    const mesasSinSede = await tx.execute(`
      INSERT INTO mesas_aislamiento_huerfanas
        (id_original, numero, estado, activa, sucursal_id, created_at, motivo)
      SELECT m.id, m.numero, m.estado, m.activa, m.sucursal_id, m.created_at,
             'Mesa sin sede válida'
      FROM mesas m
      LEFT JOIN sucursales s ON s.id = m.sucursal_id
      WHERE m.sucursal_id IS NULL OR s.id IS NULL
    `);
    await tx.execute(`
      DELETE FROM mesas
      WHERE sucursal_id IS NULL
         OR NOT EXISTS (SELECT 1 FROM sucursales s WHERE s.id = mesas.sucursal_id)
    `);

    const cuentasInvalidas = await tx.execute(`
      INSERT INTO mesa_cuentas_aislamiento_huerfanas
        (id_original, sucursal_id, numero_mesa, nombre_cliente, items_json, updated_at, motivo)
      SELECT mc.id, mc.sucursal_id, mc.numero_mesa, mc.nombre_cliente, mc.items_json, mc.updated_at,
             CASE
               WHEN json_valid(mc.items_json) = 0 THEN 'Cuenta con items_json inválido'
               ELSE 'Cuenta vacía residual'
             END
      FROM mesa_cuentas mc
      WHERE CASE
        WHEN json_valid(mc.items_json) = 0 THEN 1
        WHEN json_type(mc.items_json) <> 'array' THEN 1
        WHEN json_array_length(mc.items_json) = 0 THEN 1
        ELSE 0
      END = 1
    `);
    await tx.execute(`
      DELETE FROM mesa_cuentas
      WHERE CASE
        WHEN json_valid(items_json) = 0 THEN 1
        WHEN json_type(items_json) <> 'array' THEN 1
        WHEN json_array_length(items_json) = 0 THEN 1
        ELSE 0
      END = 1
    `);

    const cuentasSinMesa = await tx.execute(`
      INSERT INTO mesa_cuentas_aislamiento_huerfanas
        (id_original, sucursal_id, numero_mesa, nombre_cliente, items_json, updated_at, motivo)
      SELECT mc.id, mc.sucursal_id, mc.numero_mesa, mc.nombre_cliente, mc.items_json, mc.updated_at,
             'Cuenta sin mesa correspondiente en la sede'
      FROM mesa_cuentas mc
      WHERE NOT EXISTS (
        SELECT 1
        FROM mesas m
        WHERE m.sucursal_id = mc.sucursal_id AND m.numero = mc.numero_mesa
      )
    `);
    await tx.execute(`
      DELETE FROM mesa_cuentas
      WHERE NOT EXISTS (
        SELECT 1
        FROM mesas m
        WHERE m.sucursal_id = mesa_cuentas.sucursal_id
          AND m.numero = mesa_cuentas.numero_mesa
      )
    `);

    await tx.execute(`
      UPDATE mesas
      SET estado = CASE
        WHEN EXISTS (
          SELECT 1
          FROM mesa_cuentas mc
          WHERE mc.sucursal_id = mesas.sucursal_id
            AND mc.numero_mesa = mesas.numero
            AND trim(mc.items_json) NOT IN ('', '[]')
        ) THEN 'ocupada'
        ELSE 'libre'
      END
    `);

    const triggers = [
      `CREATE TRIGGER IF NOT EXISTS trg_mesas_sede_insert
       BEFORE INSERT ON mesas
       WHEN NEW.sucursal_id IS NULL
         OR NOT EXISTS (SELECT 1 FROM sucursales s WHERE s.id = NEW.sucursal_id)
       BEGIN SELECT RAISE(ABORT, 'La mesa requiere una sede válida'); END`,
      `CREATE TRIGGER IF NOT EXISTS trg_mesas_sede_update
       BEFORE UPDATE OF sucursal_id ON mesas
       WHEN NEW.sucursal_id IS NULL
         OR NOT EXISTS (SELECT 1 FROM sucursales s WHERE s.id = NEW.sucursal_id)
       BEGIN SELECT RAISE(ABORT, 'La mesa requiere una sede válida'); END`,
      `CREATE TRIGGER IF NOT EXISTS trg_mesa_cuentas_sede_mesa_insert
       BEFORE INSERT ON mesa_cuentas
       WHEN NEW.sucursal_id IS NULL
         OR NOT EXISTS (
           SELECT 1 FROM mesas m
           WHERE m.sucursal_id = NEW.sucursal_id AND m.numero = NEW.numero_mesa
         )
       BEGIN SELECT RAISE(ABORT, 'La cuenta requiere una mesa válida de la misma sede'); END`,
      `CREATE TRIGGER IF NOT EXISTS trg_mesa_cuentas_sede_mesa_update
       BEFORE UPDATE OF sucursal_id, numero_mesa ON mesa_cuentas
       WHEN NEW.sucursal_id IS NULL
         OR NOT EXISTS (
           SELECT 1 FROM mesas m
           WHERE m.sucursal_id = NEW.sucursal_id AND m.numero = NEW.numero_mesa
         )
       BEGIN SELECT RAISE(ABORT, 'La cuenta requiere una mesa válida de la misma sede'); END`,
      `CREATE TRIGGER IF NOT EXISTS trg_mesas_cuenta_abierta_delete
       BEFORE DELETE ON mesas
       WHEN EXISTS (
         SELECT 1 FROM mesa_cuentas mc
         WHERE mc.sucursal_id = OLD.sucursal_id AND mc.numero_mesa = OLD.numero
       )
       BEGIN SELECT RAISE(ABORT, 'No se puede eliminar una mesa con cuenta abierta'); END`,
    ];

    for (const sql of triggers) {
      await tx.execute(sql);
    }

    await tx.execute(
      'CREATE INDEX IF NOT EXISTS idx_mesas_sucursal ON mesas(sucursal_id)'
    );
    await tx.execute(
      'CREATE INDEX IF NOT EXISTS idx_mesa_cuentas_sucursal ON mesa_cuentas(sucursal_id)'
    );
    await tx.execute(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_mesa_cuentas_sucursal_numero ON mesa_cuentas(sucursal_id, numero_mesa)'
    );

    const invalidos = await tx.execute(`
      SELECT u.id, u.username
      FROM usuarios u
      LEFT JOIN sucursales s ON s.id = u.sucursal_id
      WHERE u.activo = 1 AND u.rol <> 'creador'
        AND (u.sucursal_id IS NULL OR s.id IS NULL)
    `);

    if (invalidos.rows.length > 0) {
      const nombres = invalidos.rows.map((row) => valor(row, 'username', 1)).join(', ');
      throw new Error(`Usuarios operativos aún sin sede válida: ${nombres}`);
    }

    await tx.commit();

    console.log(`  Usuarios corregidos por dominio: ${usuariosCorregidos.rowsAffected ?? 0}`);
    console.log(`  Cuentas sin sede resguardadas: ${cuentasSinSede.rowsAffected ?? 0}`);
    console.log(`  Mesas sin sede resguardadas: ${mesasSinSede.rowsAffected ?? 0}`);
    console.log(`  Cuentas vacías o inválidas resguardadas: ${cuentasInvalidas.rowsAffected ?? 0}`);
    console.log(`  Cuentas sin mesa resguardadas: ${cuentasSinMesa.rowsAffected ?? 0}`);
    console.log('[aislamiento-mesas] Reparación completada.');
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[aislamiento-mesas] Error:', error.message);
    process.exit(1);
  });
