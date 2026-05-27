export function stockMinimoDe(producto) {
  return producto?.stockMinimo ?? 5;
}

export function stockDisponible(producto) {
  return Math.max(0, producto?.stock ?? 0);
}

export function esSinStock(producto) {
  return stockDisponible(producto) <= 0;
}

export function esStockBajo(producto) {
  const stock = stockDisponible(producto);
  if (stock <= 0) return false;
  const minimo = stockMinimoDe(producto);
  return stock <= minimo + 5;
}

export function mensajeStockBajo(producto) {
  const stock = stockDisponible(producto);
  if (stock <= 0) return 'Sin stock';

  const minimo = stockMinimoDe(producto);
  if (stock <= minimo) return `Stock crítico: quedan ${stock}`;
  if (stock <= minimo + 5) return `Poco stock: quedan ${stock}`;
  return null;
}

export function validarCantidadStock(producto, cantidadDeseada) {
  if (!producto) {
    return { ok: false, mensaje: 'Producto no encontrado.' };
  }

  if (cantidadDeseada <= 0) {
    return { ok: false, mensaje: 'Cantidad inválida.' };
  }

  const disponible = stockDisponible(producto);
  if (disponible <= 0) {
    return { ok: false, mensaje: `"${producto.nombre}" no tiene stock disponible.` };
  }

  if (cantidadDeseada > disponible) {
    return {
      ok: false,
      mensaje: `Solo hay ${disponible} unidad(es) de "${producto.nombre}".`,
    };
  }

  return { ok: true };
}

export function validarCarritoStock(productos, carrito) {
  const cantidadesPorProducto = carrito.reduce((acc, item) => {
    acc[item.id] = (acc[item.id] ?? 0) + item.cantidad;
    return acc;
  }, {});

  for (const [productoId, cantidad] of Object.entries(cantidadesPorProducto)) {
    const producto = productos.find((p) => String(p.id) === String(productoId));
    const validacion = validarCantidadStock(producto, cantidad);
    if (!validacion.ok) {
      return validacion;
    }
  }

  return { ok: true };
}
