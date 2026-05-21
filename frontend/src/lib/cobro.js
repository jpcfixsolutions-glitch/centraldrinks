export function esMetodoEfectivo(nombre) {
  return (nombre || '').toLowerCase().includes('efectivo');
}

export function calcRecargoMonto(monto, recargoPorcentaje) {
  return (monto * recargoPorcentaje) / 100;
}

export function calcTotalesCobro({ totalVenta, descuento, pagos, metodosPago }) {
  const baseACobrar = totalVenta - descuento;
  const pagoUnicoEfectivo = pagos.length === 1 && esMetodoEfectivo(pagos[0].metodo);

  const pagosDetalle = pagos.map((pago) => {
    const metodo = metodosPago.find((m) => m.nombre === pago.metodo);
    const recargoPct = metodo?.recargo ?? 0;
    const montoIngresado = pago.monto || 0;
    const montoBase =
      pagoUnicoEfectivo && montoIngresado >= baseACobrar ? baseACobrar : montoIngresado;
    const recargoMonto = calcRecargoMonto(montoBase, recargoPct);
    return {
      metodo: pago.metodo,
      monto: montoIngresado,
      montoBase,
      recargoPct,
      recargoMonto,
    };
  });

  const totalRecargo = pagosDetalle.reduce((s, p) => s + p.recargoMonto, 0);
  const totalACobrar = baseACobrar + totalRecargo;

  const efectivoRecibido = pagoUnicoEfectivo ? pagos[0].monto || 0 : 0;
  const vuelto = pagoUnicoEfectivo ? Math.max(0, efectivoRecibido - totalACobrar) : 0;

  let montoCubierto;
  if (pagoUnicoEfectivo) {
    montoCubierto = efectivoRecibido >= totalACobrar - 0.01;
  } else {
    const sumMontosBase = pagosDetalle.reduce((s, p) => s + p.montoBase, 0);
    montoCubierto = Math.abs(sumMontosBase - baseACobrar) < 0.01;
  }

  const sumMontos = pagosDetalle.reduce((s, p) => s + p.monto, 0);

  return {
    baseACobrar,
    totalRecargo,
    totalACobrar,
    sumMontos,
    efectivoRecibido,
    vuelto,
    pagoUnicoEfectivo,
    pagosDetalle,
    montoCubierto,
  };
}

export function buildPagosPayload(pagos, metodosPago, { baseACobrar } = {}) {
  const pagoUnicoEfectivo = pagos.length === 1 && esMetodoEfectivo(pagos[0].metodo);

  return pagos.map((p) => {
    const metodo = metodosPago.find((m) => m.nombre === p.metodo);
    const montoIngresado = p.monto || 0;
    const montoRegistro =
      pagoUnicoEfectivo && montoIngresado >= baseACobrar ? baseACobrar : montoIngresado;
    const recargoMonto = calcRecargoMonto(montoRegistro, metodo?.recargo ?? 0);
    return {
      metodoPago: p.metodo,
      monto: montoRegistro,
      recargo: recargoMonto,
    };
  });
}
