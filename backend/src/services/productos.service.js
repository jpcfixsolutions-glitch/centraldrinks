import { eq, inArray, sql, and, ne } from 'drizzle-orm';
import { db } from './db.js';
import { productos } from '../models/productos.model.js';
import { promocionItems } from '../models/promocionItems.model.js';
import { categorias } from '../models/categorias.model.js';
import { exigirSucursalId } from '../lib/sucursal.js';

function calcularStockEfectivo(componentes) {
  if (!componentes.length) return 0;
  return Math.min(...componentes.map((c) => Math.floor(c.stock / c.cantidad)));
}

async function obtenerComponentesPorPromociones(promocionIds, sucursalId) {
  if (promocionIds.length === 0) return new Map();

  const filas = await db
    .select({
      promocionId: promocionItems.promocionId,
      productoId: promocionItems.productoId,
      cantidad: promocionItems.cantidad,
      nombre: productos.nombre,
      stock: productos.stock,
    })
    .from(promocionItems)
    .innerJoin(productos, eq(promocionItems.productoId, productos.id))
    .where(
      and(
        inArray(promocionItems.promocionId, promocionIds),
        eq(productos.sucursalId, sucursalId)
      )
    );

  const mapa = new Map();
  for (const fila of filas) {
    const lista = mapa.get(fila.promocionId) ?? [];
    lista.push({
      productoId: fila.productoId,
      cantidad: fila.cantidad,
      nombre: fila.nombre,
      stock: fila.stock,
    });
    mapa.set(fila.promocionId, lista);
  }
  return mapa;
}

export async function obtenerComponentes(promocionId, sucursalId) {
  const sedeId = exigirSucursalId(sucursalId);
  const mapa = await obtenerComponentesPorPromociones([promocionId], sedeId);
  return mapa.get(promocionId) ?? [];
}

async function validarComponentes(promocionId, componentes, sucursalId) {
  const sedeId = exigirSucursalId(sucursalId);
  const lista = componentes ?? [];

  const ids = lista.map((c) => c.productoId);
  if (promocionId != null && ids.includes(promocionId)) {
    const err = new Error('Una promoción no puede incluirse a sí misma como componente');
    err.status = 400;
    throw err;
  }

  const unicos = new Set(ids);
  if (unicos.size !== ids.length) {
    const err = new Error('No podés repetir el mismo producto en los componentes');
    err.status = 400;
    throw err;
  }

  if (ids.length > 0) {
    const productosSede = await db
      .select({ id: productos.id })
      .from(productos)
      .where(and(inArray(productos.id, ids), eq(productos.sucursalId, sedeId)));

    if (productosSede.length !== unicos.size) {
      const err = new Error('Todos los componentes deben pertenecer a la misma sede');
      err.status = 400;
      throw err;
    }
  }

  return lista;
}

async function guardarComponentes(promocionId, componentes, sucursalId) {
  const lista = await validarComponentes(promocionId, componentes, sucursalId);

  await db.delete(promocionItems).where(eq(promocionItems.promocionId, promocionId));

  if (lista.length === 0) return;

  await db.insert(promocionItems).values(
    lista.map((c) => ({
      promocionId,
      productoId: c.productoId,
      cantidad: c.cantidad,
    }))
  );
}

async function validarCodBarraUnico(codbarra, sucursalId, excluirId = null) {
  if (codbarra == null) return;

  const condiciones = [eq(productos.codbarra, codbarra), eq(productos.sucursalId, sucursalId)];
  if (excluirId != null) condiciones.push(ne(productos.id, excluirId));

  const [existente] = await db
    .select({ id: productos.id })
    .from(productos)
    .where(and(...condiciones))
    .limit(1);

  if (existente) {
    const err = new Error(`El código de barras ${codbarra} ya está asignado a otro producto`);
    err.status = 409;
    throw err;
  }
}

export async function buscarPorCodBarra(codbarra, sucursalId) {
  const codigo = Number(codbarra);
  if (!Number.isFinite(codigo) || codigo <= 0) return null;

  const lista = await listar(sucursalId);
  return lista.find((p) => p.codbarra === codigo) ?? null;
}

export async function listar(sucursalId) {
  const sedeId = exigirSucursalId(sucursalId);

  const lista = await db
    .select({
      id: productos.id,
      nombre: productos.nombre,
      categoriaId: productos.categoriaId,
      categoria: categorias.nombre,
      costoUnitario: productos.costoUnitario,
      precioMesa: productos.precioMesa,
      precioMostrador: productos.precioMostrador,
      stock: productos.stock,
      stockMinimo: productos.stockMinimo,
      codbarra: productos.codbarra,
      imagen: productos.imagen,
      activo: productos.activo,
    })
    .from(productos)
    .leftJoin(categorias, eq(productos.categoriaId, categorias.id))
    .where(eq(productos.sucursalId, sedeId));

  const promocionIds = lista.filter((p) => p.categoria === 'Promociones').map((p) => p.id);
  const componentesMap = await obtenerComponentesPorPromociones(promocionIds, sedeId);

  return lista.map((producto) => {
    const componentes = componentesMap.get(producto.id) ?? [];
    const esPromocionCompuesta = componentes.length > 0;
    return {
      ...producto,
      componentes,
      stock: Math.max(
        0,
        esPromocionCompuesta ? calcularStockEfectivo(componentes) : producto.stock
      ),
    };
  });
}

export async function crear(data, sucursalId) {
  const sedeId = exigirSucursalId(sucursalId);
  const { componentes, ...productoData } = data;

  await validarCodBarraUnico(productoData.codbarra ?? null, sedeId);

  if (componentes?.length > 0) {
    await validarComponentes(null, componentes, sedeId);
    productoData.stock = 0;
  }

  const [creado] = await db
    .insert(productos)
    .values({ ...productoData, sucursalId: sedeId })
    .returning();

  if (componentes?.length > 0) {
    await guardarComponentes(creado.id, componentes, sedeId);
  }

  const componentesGuardados = await obtenerComponentes(creado.id, sedeId);
  return {
    ...creado,
    componentes: componentesGuardados,
    stock: Math.max(
      0,
      componentesGuardados.length > 0 ? calcularStockEfectivo(componentesGuardados) : creado.stock
    ),
  };
}

export async function actualizar(id, data, sucursalId) {
  const sedeId = exigirSucursalId(sucursalId);
  const { componentes, ...productoData } = data;

  const [existente] = await db
    .select({ id: productos.id })
    .from(productos)
    .where(and(eq(productos.id, id), eq(productos.sucursalId, sedeId)))
    .limit(1);
  if (!existente) return null;

  if (productoData.codbarra !== undefined) {
    await validarCodBarraUnico(productoData.codbarra ?? null, sedeId, id);
  }

  if (componentes !== undefined) {
    if (componentes.length > 0) {
      productoData.stock = 0;
    }
    await guardarComponentes(id, componentes, sedeId);
  }

  const where = and(eq(productos.id, id), eq(productos.sucursalId, sedeId));

  const [actualizado] = await db.update(productos).set(productoData).where(where).returning();
  if (!actualizado) return null;

  const componentesGuardados = await obtenerComponentes(id, sedeId);
  return {
    ...actualizado,
    componentes: componentesGuardados,
    stock: Math.max(
      0,
      componentesGuardados.length > 0 ? calcularStockEfectivo(componentesGuardados) : actualizado.stock
    ),
  };
}

export async function eliminar(id, sucursalId) {
  const sedeId = exigirSucursalId(sucursalId);
  const where = and(eq(productos.id, id), eq(productos.sucursalId, sedeId));

  const [borrado] = await db.delete(productos).where(where).returning();
  return !!borrado;
}

export async function validarStockVenta(items, sucursalId) {
  const sedeId = exigirSucursalId(sucursalId);
  const demandaPorProducto = new Map();

  for (const item of items) {
    if (!item.productoId) continue;
    demandaPorProducto.set(
      item.productoId,
      (demandaPorProducto.get(item.productoId) ?? 0) + item.cantidad
    );
  }

  for (const [productoId, cantidadSolicitada] of demandaPorProducto) {
    const [producto] = await db
      .select()
      .from(productos)
      .where(and(eq(productos.id, productoId), eq(productos.sucursalId, sedeId)));
    if (!producto) {
      const err = new Error(`Producto no encontrado (id ${productoId})`);
      err.status = 400;
      throw err;
    }

    const componentes = await obtenerComponentes(productoId, sedeId);
    if (componentes.length > 0) {
      const stockPromo = calcularStockEfectivo(componentes);
      if (cantidadSolicitada > stockPromo) {
        const err = new Error(
          stockPromo <= 0
            ? `"${producto.nombre}" no tiene stock disponible (componentes agotados).`
            : `Stock insuficiente para "${producto.nombre}". Disponible: ${stockPromo}.`
        );
        err.status = 400;
        throw err;
      }

      for (const componente of componentes) {
        const necesario = componente.cantidad * cantidadSolicitada;
        if (componente.stock < necesario) {
          const err = new Error(
            `Stock insuficiente de "${componente.nombre}" para la promoción "${producto.nombre}".`
          );
          err.status = 400;
          throw err;
        }
      }
    } else {
      const stockActual = Math.max(0, producto.stock);
      if (cantidadSolicitada > stockActual) {
        const err = new Error(
          stockActual <= 0
            ? `"${producto.nombre}" no tiene stock disponible.`
            : `Stock insuficiente para "${producto.nombre}". Disponible: ${stockActual}.`
        );
        err.status = 400;
        throw err;
      }
    }
  }
}

export async function descontarStock(productoId, cantidad, sucursalId) {
  const sedeId = exigirSucursalId(sucursalId);
  const [actualizado] = await db
    .update(productos)
    .set({ stock: sql`${productos.stock} - ${cantidad}` })
    .where(
      and(
        eq(productos.id, productoId),
        eq(productos.sucursalId, sedeId),
        sql`${productos.stock} >= ${cantidad}`
      )
    )
    .returning({ nombre: productos.nombre });

  if (!actualizado) {
    const [producto] = await db
      .select({ nombre: productos.nombre })
      .from(productos)
      .where(and(eq(productos.id, productoId), eq(productos.sucursalId, sedeId)));

    const err = new Error(
      `No se pudo descontar stock de "${producto?.nombre ?? 'producto'}".`
    );
    err.status = 400;
    throw err;
  }
}

export async function descontarStockVenta(items, sucursalId) {
  const sedeId = exigirSucursalId(sucursalId);
  for (const item of items) {
    if (!item.productoId) continue;

    const componentes = await obtenerComponentes(item.productoId, sedeId);
    if (componentes.length > 0) {
      for (const componente of componentes) {
        await descontarStock(
          componente.productoId,
          componente.cantidad * item.cantidad,
          sedeId
        );
      }
    } else {
      await descontarStock(item.productoId, item.cantidad, sedeId);
    }
  }
}
