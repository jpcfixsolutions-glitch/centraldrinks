import { parseFechaDB } from '../lib/fechas.js';

export function esMetodoEfectivo(nombre) {
  return (nombre || '').toLowerCase().includes('efectivo');
}

export function calcularResumenDesdeVentas({ efectivoInicial, ventas, pagosPorVenta, gastos, fechaApertura }) {
  let ingresoEfectivo = 0;
  let ingresoVirtual = 0;

  const ventasFiltradas = ventas.filter((v) => {
    if (!fechaApertura) return true;
    return parseFechaDB(v.fecha) >= parseFechaDB(fechaApertura);
  });

  for (const venta of ventasFiltradas) {
    const pagos = pagosPorVenta.get(venta.id) ?? [];
    if (pagos.length === 0) {
      const total = venta.total;
      if (esMetodoEfectivo(venta.metodoPago)) ingresoEfectivo += total;
      else ingresoVirtual += total;
      continue;
    }
    for (const pago of pagos) {
      const totalPago = pago.monto + (pago.recargo || 0);
      if (esMetodoEfectivo(pago.metodoPago)) ingresoEfectivo += totalPago;
      else ingresoVirtual += totalPago;
    }
  }

  const gastosFiltrados = gastos.filter((g) => {
    if (!fechaApertura) return true;
    return parseFechaDB(g.fecha) >= parseFechaDB(fechaApertura);
  });

  const egresoEfectivo = gastosFiltrados
    .filter((g) => esMetodoEfectivo(g.metodoPago))
    .reduce((sum, g) => sum + g.monto, 0);

  return {
    ingresoEfectivo,
    ingresoVirtual,
    egresoEfectivo,
    efectivoEsperado: efectivoInicial + ingresoEfectivo - egresoEfectivo,
    ingresoTotal: ingresoEfectivo + ingresoVirtual,
    cantidadVentas: ventasFiltradas.length,
  };
}
