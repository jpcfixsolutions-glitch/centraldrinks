export function esMetodoEfectivo(nombre) {
  return (nombre || '').toLowerCase().includes('efectivo');
}

export function calcularResumenCaja({ efectivoInicial = 0, ventas = [], gastos = [], fechaApertura }) {
  let ingresoEfectivo = 0;
  let ingresoVirtual = 0;

  const ventasSesion = ventas.filter((v) => {
    if (fechaApertura && v.fecha) {
      return new Date(v.fecha) >= new Date(fechaApertura);
    }
    return true;
  });

  for (const venta of ventasSesion) {
    const pagos = venta.pagos?.length > 0
      ? venta.pagos
      : [{ metodoPago: venta.metodoPago, monto: venta.total - (venta.pagos?.reduce((s, p) => s + (p.recargo || 0), 0) || 0), recargo: 0 }];

    for (const pago of pagos) {
      const totalPago = (pago.monto || 0) + (pago.recargo || 0);
      if (esMetodoEfectivo(pago.metodoPago)) {
        ingresoEfectivo += totalPago;
      } else {
        ingresoVirtual += totalPago;
      }
    }
  }

  const gastosSesion = gastos.filter((g) => {
    if (!fechaApertura || !g.fecha) return true;
    return new Date(g.fecha) >= new Date(fechaApertura);
  });

  const egresoEfectivo = gastosSesion
    .filter((g) => esMetodoEfectivo(g.metodo || g.metodoPago))
    .reduce((sum, g) => sum + g.monto, 0);

  const efectivoEsperado = efectivoInicial + ingresoEfectivo - egresoEfectivo;
  const ingresoTotal = ingresoEfectivo + ingresoVirtual;

  return {
    ingresoEfectivo,
    ingresoVirtual,
    egresoEfectivo,
    efectivoEsperado,
    ingresoTotal,
    cantidadVentas: ventasSesion.length,
  };
}
