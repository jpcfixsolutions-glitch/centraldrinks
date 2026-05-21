import { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Printer } from 'lucide-react';
import { calcTotalesCobro, buildPagosPayload, esMetodoEfectivo } from '../lib/cobro.js';
import { TicketCobro, imprimirTicket } from './TicketCobro.jsx';

export function CobroDivididoModal({
  isOpen,
  onClose,
  totalVenta,
  onConfirmar,
  metodosPago,
  items = [],
  tipo = 'mostrador',
  numeroMesa,
}) {
  const [descuento, setDescuento] = useState(0);
  const [pagos, setPagos] = useState([{ id: 1, metodo: metodosPago[0]?.nombre || '', monto: 0 }]);
  const [procesando, setProcesando] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const ticketRef = useRef(null);

  const {
    baseACobrar,
    totalRecargo,
    totalACobrar,
    pagosDetalle,
    montoCubierto,
    vuelto,
    pagoUnicoEfectivo,
    efectivoRecibido,
  } = calcTotalesCobro({
    totalVenta,
    descuento,
    pagos,
    metodosPago,
  });

  const sumMontosBase = pagosDetalle.reduce((s, p) => s + p.montoBase, 0);
  const diferencia = sumMontosBase - baseACobrar;
  const faltante = !pagoUnicoEfectivo && diferencia < -0.01;
  const sobrante = !pagoUnicoEfectivo && pagos.length > 1 && diferencia > 0.01;

  useEffect(() => {
    if (isOpen) {
      setDescuento(0);
      const base = totalVenta;
      setPagos([{ id: 1, metodo: metodosPago[0]?.nombre || '', monto: base }]);
      setProcesando(false);
      setErrorMsg(null);
    }
  }, [isOpen, metodosPago, totalVenta]);

  useEffect(() => {
    if (!isOpen || pagos.length !== 1) return;
    const pago = pagos[0];
    if (esMetodoEfectivo(pago.metodo)) return;
    const base = totalVenta - descuento;
    setPagos([{ ...pago, monto: base }]);
  }, [descuento, isOpen, totalVenta, pagos.length]);

  if (!isOpen) return null;

  const agregarMetodoPago = () => {
    if (pagos.length >= 2) return;
    const nuevoId = Math.max(...pagos.map((p) => p.id)) + 1;
    const metodoDisponible = metodosPago.find((m) => !pagos.some((p) => p.metodo === m.nombre));
    const sumaActual = pagosDetalle.reduce((s, p) => s + p.montoBase, 0);
    const pendiente = Math.max(0, baseACobrar - sumaActual);
    setPagos([
      ...pagos,
      { id: nuevoId, metodo: metodoDisponible?.nombre || metodosPago[0]?.nombre || '', monto: pendiente },
    ]);
  };

  const eliminarMetodoPago = (id) => {
    if (pagos.length === 1) return;
    const restantes = pagos.filter((p) => p.id !== id);
    if (restantes.length === 1) {
      const metodo = restantes[0].metodo;
      restantes[0].monto = esMetodoEfectivo(metodo) ? totalACobrar : baseACobrar;
    }
    setPagos(restantes);
  };

  const actualizarMonto = (id, monto) => {
    const montoNumero = parseFloat(monto) || 0;
    setPagos(pagos.map((p) => (p.id === id ? { ...p, monto: montoNumero } : p)));
  };

  const actualizarMetodo = (id, metodo) => {
    setPagos(
      pagos.map((p) => {
        if (p.id !== id) return p;
        const esUnico = pagos.length === 1;
        const montoSugerido = esMetodoEfectivo(metodo) ? totalACobrar : baseACobrar;
        return { ...p, metodo, monto: esUnico ? montoSugerido : p.monto };
      })
    );
  };

  const handleImprimir = () => {
    imprimirTicket(ticketRef.current);
  };

  const handleConfirmar = async () => {
    if (!montoCubierto) return;
    setErrorMsg(null);
    setProcesando(true);
    try {
      const pagosPayload = buildPagosPayload(pagos, metodosPago, { baseACobrar });
      await onConfirmar({
        descuento,
        pagos: pagosPayload,
        metodoPagoPrincipal: pagos[0]?.metodo ?? '',
        totalACobrar,
        subtotal: totalVenta,
        baseACobrar,
        totalRecargo,
        vuelto,
        efectivoRecibido: pagoUnicoEfectivo ? efectivoRecibido : undefined,
      });
    } catch (err) {
      setErrorMsg(err.message || 'Error al registrar la venta');
    } finally {
      setProcesando(false);
    }
  };

  const itemsTicket = items.map((p) => ({
    nombre: p.nombre,
    nombreProducto: p.nombre,
    precio: p.precio,
    cantidad: p.cantidad,
  }));

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
          <h2 className="text-xl font-bold">Cobro</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">DESCUENTO ($)</label>
            <input
              type="number"
              value={descuento || ''}
              onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          <div className="space-y-4">
            <label className="block text-sm text-zinc-400">MÉTODO DE PAGO</label>

            {pagos.map((pago, index) => {
              const detalle = pagosDetalle.find((d) => d.metodo === pago.metodo);
              const esEfectivo = esMetodoEfectivo(pago.metodo);
              const labelMonto =
                esEfectivo && pagos.length === 1 ? 'Efectivo recibido ($)' : 'Monto ($)';

              return (
                <div key={pago.id} className={`space-y-2 ${index > 0 ? 'pt-4 border-t border-red-900' : ''}`}>
                  {index > 0 && (
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-red-500">SEGUNDO PAGO</label>
                      <button
                        onClick={() => eliminarMetodoPago(pago.id)}
                        className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={pago.metodo}
                      onChange={(e) => actualizarMetodo(pago.id, e.target.value)}
                      className="bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                    >
                      {metodosPago.map((metodo) => (
                        <option key={metodo.id} value={metodo.nombre}>
                          {metodo.nombre}{' '}
                          {metodo.recargo !== 0 && `(${metodo.recargo > 0 ? '+' : ''}${metodo.recargo}%)`}
                        </option>
                      ))}
                    </select>
                    <div>
                      <input
                        type="number"
                        value={pago.monto || ''}
                        onChange={(e) => actualizarMonto(pago.id, e.target.value)}
                        placeholder={labelMonto}
                        min="0"
                        step="1"
                        className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                      {esEfectivo && pagos.length === 1 && (
                        <p className="text-[10px] text-zinc-500 mt-1">Podés ingresar más del total (vuelto)</p>
                      )}
                    </div>
                  </div>
                  {detalle && detalle.recargoMonto !== 0 && pago.monto > 0 && (
                    <p className="text-xs text-red-400">
                      Recargo {detalle.recargoPct > 0 ? '+' : ''}
                      {detalle.recargoPct}%:{' '}
                      <span className="font-medium">
                        {detalle.recargoMonto > 0 ? '+' : ''}${detalle.recargoMonto.toLocaleString()}
                      </span>
                    </p>
                  )}
                </div>
              );
            })}

            {pagos.length < 2 && (
              <button
                onClick={agregarMetodoPago}
                className="w-full bg-zinc-800 hover:bg-zinc-700 transition-colors rounded-lg px-4 py-3 flex items-center justify-center gap-2 border border-dashed border-zinc-700"
              >
                <Plus className="w-4 h-4" />
                Combinar con otro método
              </button>
            )}
          </div>

          <div className="bg-zinc-800 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Subtotal productos:</span>
              <span className="text-zinc-300">${totalVenta.toLocaleString()}</span>
            </div>
            {descuento > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Descuento:</span>
                <span className="text-green-500">-${descuento.toLocaleString()}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Importe (sin recargo):</span>
              <span className="text-zinc-300">${baseACobrar.toLocaleString()}</span>
            </div>
            {totalRecargo !== 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Recargo método de pago:</span>
                <span className={totalRecargo > 0 ? 'text-red-500' : 'text-green-500'}>
                  {totalRecargo > 0 ? '+' : ''}${totalRecargo.toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex items-start justify-between pt-2 border-t border-zinc-700">
              <div>
                <p className="text-lg font-medium">TOTAL A COBRAR:</p>
                {pagoUnicoEfectivo && efectivoRecibido > 0 && (
                  <p className="text-sm text-zinc-400 mt-1">
                    Recibido: ${efectivoRecibido.toLocaleString()}
                  </p>
                )}
                {faltante && (
                  <p className="text-sm text-yellow-500">
                    Falta cubrir: ${Math.abs(diferencia).toLocaleString()} del importe
                  </p>
                )}
                {sobrante && (
                  <p className="text-sm text-yellow-500">
                    Sobran: ${diferencia.toLocaleString()} en el importe
                  </p>
                )}
                {montoCubierto && !vuelto && (
                  <p className="text-sm text-green-500">✓ Listo para confirmar</p>
                )}
              </div>
              <p className="text-2xl font-bold text-red-500">${totalACobrar.toLocaleString()}</p>
            </div>

            {pagoUnicoEfectivo && vuelto > 0 && (
              <div className="flex items-center justify-between pt-3 mt-2 border-t border-emerald-800/50 bg-emerald-900/20 -mx-2 px-2 py-3 rounded-lg">
                <span className="text-sm font-medium text-emerald-400">Vuelto a entregar:</span>
                <span className="text-2xl font-bold text-emerald-400">${vuelto.toLocaleString()}</span>
              </div>
            )}

            {pagoUnicoEfectivo && !montoCubierto && efectivoRecibido > 0 && (
              <p className="text-sm text-yellow-500 pt-1">
                Falta ${(totalACobrar - efectivoRecibido).toLocaleString()} para cubrir el total
              </p>
            )}
          </div>

          {errorMsg && (
            <div className="bg-red-900/40 border border-red-700 text-red-200 rounded-lg px-4 py-3 text-sm">
              {errorMsg}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleImprimir}
              disabled={!montoCubierto}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 transition-colors rounded-lg py-4 font-medium flex items-center justify-center gap-2"
            >
              <Printer className="w-5 h-5" />
              Imprimir
            </button>
            <button
              onClick={handleConfirmar}
              disabled={!montoCubierto || procesando}
              className="flex-[2] bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg py-4 font-medium"
            >
              {procesando ? 'Procesando...' : 'Confirmar y Cerrar'}
            </button>
          </div>
        </div>
      </div>

      <div className="hidden" aria-hidden="true">
        <div ref={ticketRef}>
          <TicketCobro
            items={itemsTicket}
            descuento={descuento}
            pagos={pagos}
            metodosPago={metodosPago}
            tipo={tipo}
            numeroMesa={numeroMesa}
            vuelto={vuelto}
            efectivoRecibido={pagoUnicoEfectivo ? efectivoRecibido : undefined}
          />
        </div>
      </div>
    </div>
  );
}
