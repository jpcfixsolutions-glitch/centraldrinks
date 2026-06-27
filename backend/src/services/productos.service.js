import { eq, inArray, sql, and, ne } from 'drizzle-orm';
import { db } from './db.js';
import { productos } from '../models/productos.model.js';
import { promocionItems } from '../models/promocionItems.model.js';
import { categorias } from '../models/categorias.model.js';

function calcularStockEfectivo(componentes) {
  if (!componentes.length) return 0;
  return Math.min(...componentes.map((c) => Math.floor(c.stock / c.cantidad)));
}

async function obtenerComponentesPorPromociones(promocionIds) {
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
    .where(inArray(promocionItems.promocionId, promocionIds));

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

export async function obtenerComponentes(promocionId) {
  const mapa = await obtenerComponentesPorPromociones([promocionId]);
  return mapa.get(promocionId) ?? [];
}

async function guardarComponentes(promocionId, componentes) {
  await db.delete(promocionItems).where(eq(promocionItems.promocionId, promocionId));

  if (!componentes?.length) return;

  const ids = componentes.map((c) => c.productoId);
  if (ids.includes(promocionId)) {
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

  await db.insert(promocionItems).values(
    componentes.map((c) => ({
      promocionId,
      productoId: c.productoId,
      cantidad: c.cantidad,
    }))
  );
}

async function validarCodBarraUnico(codbarra, excluirId = null) {
  if (codbarra == null) return;

  const where =
    excluirId != null
      ? and(eq(productos.codbarra, codbarra), ne(productos.id, excluirId))
      : eq(productos.codbarra, codbarra);

  const [existente] = await db.select({ id: productos.id }).from(productos).where(where).limit(1);

  if (existente) {
    const err = new Error(`El código de barras ${codbarra} ya está asignado a otro producto`);
    err.status = 409;
    throw err;
  }
}

export async function buscarPorCodBarra(codbarra) {
  const codigo = Number(codbarra);
  if (!Number.isFinite(codigo) || codigo <= 0) return null;

  const lista = await listar();
  return lista.find((p) => p.codbarra === codigo) ?? null;
}

export async function listar() {
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
    .leftJoin(categorias, eq(productos.categoriaId, categorias.id));

  const promocionIds = lista.filter((p) => p.categoria === 'Promociones').map((p) => p.id);
  const componentesMap = await obtenerComponentesPorPromociones(promocionIds);

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

export async function crear(data) {
  const { componentes, ...productoData } = data;

  await validarCodBarraUnico(productoData.codbarra ?? null);

  if (componentes?.length > 0) {
    productoData.stock = 0;
  }

  const [creado] = await db.insert(productos).values(productoData).returning();

  if (componentes?.length > 0) {
    await guardarComponentes(creado.id, componentes);
  }

  const componentesGuardados = await obtenerComponentes(creado.id);
  return {
    ...creado,
    componentes: componentesGuardados,
    stock: Math.max(
      0,
      componentesGuardados.length > 0 ? calcularStockEfectivo(componentesGuardados) : creado.stock
    ),
  };
}

export async function actualizar(id, data) {
  const { componentes, ...productoData } = data;

  if (productoData.codbarra !== undefined) {
    await validarCodBarraUnico(productoData.codbarra ?? null, id);
  }

  if (componentes !== undefined) {
    if (componentes.length > 0) {
      productoData.stock = 0;
    }
    await guardarComponentes(id, componentes);
  }

  const [actualizado] = await db.update(productos).set(productoData).where(eq(productos.id, id)).returning();
  if (!actualizado) return null;

  const componentesGuardados = await obtenerComponentes(id);
  return {
    ...actualizado,
    componentes: componentesGuardados,
    stock: Math.max(
      0,
      componentesGuardados.length > 0 ? calcularStockEfectivo(componentesGuardados) : actualizado.stock
    ),
  };
}

export async function eliminar(id) {
  const [borrado] = await db.delete(productos).where(eq(productos.id, id)).returning();
  return !!borrado;
}

export async function validarStockVenta(items) {
  const demandaPorProducto = new Map();

  for (const item of items) {
    if (!item.productoId) continue;
    demandaPorProducto.set(
      item.productoId,
      (demandaPorProducto.get(item.productoId) ?? 0) + item.cantidad
    );
  }

  for (const [productoId, cantidadSolicitada] of demandaPorProducto) {
    const [producto] = await db.select().from(productos).where(eq(productos.id, productoId));
    if (!producto) {
      const err = new Error(`Producto no encontrado (id ${productoId})`);
      err.status = 400;
      throw err;
    }

    const componentes = await obtenerComponentes(productoId);
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

export async function descontarStock(productoId, cantidad) {
  const [actualizado] = await db
    .update(productos)
    .set({ stock: sql`${productos.stock} - ${cantidad}` })
    .where(and(eq(productos.id, productoId), sql`${productos.stock} >= ${cantidad}`))
    .returning({ nombre: productos.nombre });

  if (!actualizado) {
    const [producto] = await db
      .select({ nombre: productos.nombre })
      .from(productos)
      .where(eq(productos.id, productoId));

    const err = new Error(
      `No se pudo descontar stock de "${producto?.nombre ?? 'producto'}".`
    );
    err.status = 400;
    throw err;
  }
}

export async function descontarStockVenta(items) {
  for (const item of items) {
    if (!item.productoId) continue;

    const componentes = await obtenerComponentes(item.productoId);
    if (componentes.length > 0) {
      for (const componente of componentes) {
        await descontarStock(componente.productoId, componente.cantidad * item.cantidad);
      }
    } else {
      await descontarStock(item.productoId, item.cantidad);
    }
  }
}
