export function ventaATicketProps(venta) {
  const items = venta.items?.length
    ? venta.items
    : (venta.productos || []).map((p) => ({
        nombreProducto: p.nombre,
        nombre: p.nombre,
        precio: p.precio,
        cantidad: p.cantidad,
      }));

  return {
    items,
    descuento: venta.descuento || 0,
    pagos: (venta.pagos || []).map((p) => ({
      metodo: p.metodoPago ?? p.metodo,
      monto: p.monto,
    })),
    tipo: venta.tipo,
    numeroMesa: venta.numeroMesa,
    codigo: venta.codigo,
    fecha: venta.fecha ? new Date(venta.fecha) : new Date(),
  };
}
