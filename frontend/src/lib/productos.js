export function normalizarCodBarra(codigo) {
  return String(codigo ?? '').trim().replace(/\D/g, '');
}

export function productoPorCodBarra(productos, codigo) {
  const normalizado = normalizarCodBarra(codigo);
  if (!normalizado) return null;

  return (
    productos.find((p) => p.codbarra != null && String(p.codbarra) === normalizado) ?? null
  );
}

export function productoCoincideBusqueda(producto, termino) {
  const busqueda = termino.trim().toLowerCase();
  if (!busqueda) return true;

  const codigo = normalizarCodBarra(termino);
  const coincideNombre = producto.nombre?.toLowerCase().includes(busqueda);
  const coincideCodigo =
    codigo.length > 0 &&
    producto.codbarra != null &&
    String(producto.codbarra).includes(codigo);

  return coincideNombre || coincideCodigo;
}
