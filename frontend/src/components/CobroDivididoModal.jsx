import { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Printer, CreditCard, ArrowLeft, UserPlus, Search } from 'lucide-react';
import {
  calcTotalesCobro,
  buildPagosPayload,
  calcRecargoMonto,
  esMetodoEfectivo,
  metodoPagoValido,
} from '../lib/cobro.js';
import { TicketCobro, imprimirTicket } from './TicketCobro.jsx';
import { ApiError, clientesApi } from '../lib/api.js';
import { METODO_CUENTA_CORRIENTE } from '../lib/cuentaCorriente.js';

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
  const [pagos, setPagos] = useState([{ id: 1, metodo: '', monto: 0 }]);
  const [procesando, setProcesando] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const ticketRef = useRef(null);

  // Flujo cuenta corriente
  const [modoCuenta, setModoCuenta] = useState(false);
  const [pasoCuenta, setPasoCuenta] = useState('dni'); // dni | crear | confirmar
  const [documento, setDocumento] = useState('');
  const [cliente, setCliente] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [montoCuenta, setMontoCuenta] = useState(0);
  const [metodoRestante, setMetodoRestante] = useState('');
  /** Pagos ya cargados en el cobro normal antes de entrar a cuenta (parcial). */
  const [pagosPrevios, setPagosPrevios] = useState([]);
  const [formNuevo, setFormNuevo] = useState({
    nombre: '',
    apellido: '',
    documento: '',
    telefono: '',
  });

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

  const metodosSeleccionados = pagos.every((p) => metodoPagoValido(p.metodo));
  const puedeConfirmar = montoCubierto && metodosSeleccionados;
  const sumMontosBase = pagosDetalle.reduce((s, p) => s + p.montoBase, 0);
  const diferencia = sumMontosBase - baseACobrar;
  const faltante = !pagoUnicoEfectivo && diferencia < -0.01;
  const sobrante = !pagoUnicoEfectivo && pagos.length > 1 && diferencia > 0.01;

  const resetCuenta = () => {
    setModoCuenta(false);
    setPasoCuenta('dni');
    setDocumento('');
    setCliente(null);
    setMontoCuenta(0);
    setMetodoRestante('');
    setPagosPrevios([]);
    setFormNuevo({ nombre: '', apellido: '', documento: '', telefono: '' });
  };

  const entrarModoCuenta = () => {
    const total = Math.max(0, totalVenta - descuento);
    // Si ya hay pagos parciales válidos, se conservan y el saldo pendiente va a cuenta
    const previos = pagos.filter(
      (p) => metodoPagoValido(p.metodo) && (Number(p.monto) || 0) > 0
    );
    const cubierto = pagosDetalle
      .filter((d) => metodoPagoValido(d.metodo) && d.montoBase > 0)
      .reduce((s, d) => s + d.montoBase, 0);
    const pendiente = Math.round((total - cubierto) * 100) / 100;

    if (cubierto > 0.01 && pendiente > 0.01) {
      setPagosPrevios(previos);
      setMontoCuenta(Math.max(0, pendiente));
    } else {
      setPagosPrevios([]);
      setMontoCuenta(total);
    }
    setMetodoRestante('');
    setModoCuenta(true);
    setPasoCuenta('dni');
    setErrorMsg(null);
  };

  useEffect(() => {
    if (isOpen) {
      setDescuento(0);
      setPagos([{ id: 1, metodo: '', monto: 0 }]);
      setProcesando(false);
      setErrorMsg(null);
      resetCuenta();
    }
  }, [isOpen, metodosPago, totalVenta]);

  useEffect(() => {
    if (!isOpen || pagos.length !== 1 || modoCuenta) return;
    const pago = pagos[0];
    if (!metodoPagoValido(pago.metodo) || esMetodoEfectivo(pago.metodo)) return;
    const base = totalVenta - descuento;
    setPagos([{ ...pago, monto: base }]);
  }, [descuento, isOpen, totalVenta, pagos.length, modoCuenta]);

  if (!isOpen) return null;

  const agregarMetodoPago = () => {
    if (pagos.length >= 2 || !metodoPagoValido(pagos[0]?.metodo)) return;
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
      restantes[0] = { ...restantes[0], monto: baseACobrar };
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
        if (!metodoPagoValido(metodo)) {
          return { ...p, metodo, monto: 0 };
        }
        return { ...p, metodo, monto: esUnico ? baseACobrar : p.monto };
      })
    );
  };

  const handleImprimir = () => {
    imprimirTicket(ticketRef.current);
  };

  const handleConfirmar = async () => {
    if (!puedeConfirmar) return;
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

  const handleBuscarDocumento = async () => {
    const doc = documento.replace(/\D/g, '');
    if (doc.length < 6) {
      setErrorMsg('Ingresá un DNI válido (mínimo 6 dígitos)');
      return;
    }
    setErrorMsg(null);
    setBuscando(true);
    try {
      const encontrado = await clientesApi.buscarPorDocumento(doc);
      setCliente(encontrado);
      setPasoCuenta('confirmar');
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setFormNuevo({ nombre: '', apellido: '', documento: doc, telefono: '' });
        setPasoCuenta('crear');
      } else {
        setErrorMsg(err.message || 'No se pudo buscar el cliente');
      }
    } finally {
      setBuscando(false);
    }
  };

  const handleCrearCliente = async () => {
    const { nombre, apellido, documento: doc, telefono } = formNuevo;
    if (!nombre.trim() || !apellido.trim() || !doc.trim() || !telefono.trim()) {
      setErrorMsg('Completá todos los datos del cliente');
      return;
    }
    setErrorMsg(null);
    setProcesando(true);
    try {
      const creado = await clientesApi.crear({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        documento: doc.replace(/\D/g, ''),
        telefono: telefono.trim(),
      });
      setCliente(creado);
      setPasoCuenta('confirmar');
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo crear el cliente');
    } finally {
      setProcesando(false);
    }
  };

  const totalCuenta = Math.max(0, totalVenta - descuento);
  const montoCuentaNum = Math.max(0, Number(montoCuenta) || 0);
  const cubiertoPrevios = pagosPrevios.reduce((s, p) => s + (Number(p.monto) || 0), 0);
  const saldoRestante = Math.round((totalCuenta - montoCuentaNum - cubiertoPrevios) * 100) / 100;
  const haySaldoRestante = saldoRestante > 0.01;
  const metodoRestanteObj = metodosPago.find((m) => m.nombre === metodoRestante);
  const recargoRestante = haySaldoRestante
    ? calcRecargoMonto(saldoRestante, metodoRestanteObj?.recargo ?? 0)
    : 0;
  const recargoPrevios = pagosPrevios.reduce((s, p) => {
    const m = metodosPago.find((x) => x.nombre === p.metodo);
    return s + calcRecargoMonto(Number(p.monto) || 0, m?.recargo ?? 0);
  }, 0);
  const totalRecargoCuenta = recargoRestante + recargoPrevios;
  const totalACobrarCuenta = totalCuenta + totalRecargoCuenta;
  const maxMontoCuenta = Math.max(0, Math.round((totalCuenta - cubiertoPrevios) * 100) / 100);
  const puedeConfirmarCuenta =
    Boolean(cliente) &&
    montoCuentaNum > 0.01 &&
    montoCuentaNum <= maxMontoCuenta + 0.01 &&
    (!haySaldoRestante || metodoPagoValido(metodoRestante));

  const handleConfirmarCuenta = async () => {
    if (!puedeConfirmarCuenta) return;

    const montoACuenta = Math.min(montoCuentaNum, maxMontoCuenta);
    const pagosPayload = [];

    if (pagosPrevios.length > 0) {
      pagosPayload.push(
        ...buildPagosPayload(pagosPrevios, metodosPago, { baseACobrar: totalCuenta })
      );
    }

    if (haySaldoRestante) {
      pagosPayload.push({
        metodoPago: metodoRestante,
        monto: saldoRestante,
        recargo: recargoRestante,
      });
    }

    pagosPayload.push({
      metodoPago: METODO_CUENTA_CORRIENTE,
      monto: montoACuenta,
      recargo: 0,
    });

    const metodoPrincipal =
      pagosPayload.find((p) => p.metodoPago !== METODO_CUENTA_CORRIENTE)?.metodoPago ||
      METODO_CUENTA_CORRIENTE;

    setErrorMsg(null);
    setProcesando(true);
    try {
      await onConfirmar({
        descuento,
        pagos: pagosPayload,
        metodoPagoPrincipal: metodoPrincipal,
        totalACobrar: totalACobrarCuenta,
        subtotal: totalVenta,
        baseACobrar: totalCuenta,
        totalRecargo: totalRecargoCuenta,
        clienteId: cliente.id,
        cliente,
      });
    } catch (err) {
      setErrorMsg(err.message || 'Error al cargar a cuenta corriente');
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
          <div className="flex items-center gap-2">
            {modoCuenta && (
              <button
                onClick={() => {
                  resetCuenta();
                  setErrorMsg(null);
                }}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-xl font-bold">
              {modoCuenta ? 'Cuenta corriente' : 'Cobro'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!modoCuenta ? (
            <>
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
                  const metodoSeleccionado = metodoPagoValido(pago.metodo);
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <select
                          value={pago.metodo}
                          onChange={(e) => actualizarMetodo(pago.id, e.target.value)}
                          className="bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                        >
                          <option value="">Seleccionar</option>
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
                            value={metodoSeleccionado ? pago.monto || '' : ''}
                            onChange={(e) => actualizarMonto(pago.id, e.target.value)}
                            placeholder={labelMonto}
                            min="0"
                            step="1"
                            disabled={!metodoSeleccionado}
                            className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    disabled={!metodoPagoValido(pagos[0]?.metodo)}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg px-4 py-3 flex items-center justify-center gap-2 border border-dashed border-zinc-700"
                  >
                    <Plus className="w-4 h-4" />
                    Combinar con otro método
                  </button>
                )}

                <button
                  onClick={entrarModoCuenta}
                  className="w-full bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 transition-colors rounded-lg px-4 py-3 flex items-center justify-center gap-2 border border-amber-600/40"
                >
                  <CreditCard className="w-4 h-4" />
                  Cargar a cuenta corriente
                </button>
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
                    {montoCubierto && metodosSeleccionados && !vuelto && (
                      <p className="text-sm text-green-500">✓ Listo para confirmar</p>
                    )}
                    {!metodosSeleccionados && (
                      <p className="text-sm text-amber-400">Seleccioná un método de pago</p>
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
              </div>

              {errorMsg && (
                <div className="bg-red-900/40 border border-red-700 text-red-200 rounded-lg px-4 py-3 text-sm">
                  {errorMsg}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleImprimir}
                  disabled={!puedeConfirmar}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 transition-colors rounded-lg py-4 font-medium flex items-center justify-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  Imprimir
                </button>
                <button
                  onClick={handleConfirmar}
                  disabled={!puedeConfirmar || procesando}
                  className="flex-[2] bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg py-4 font-medium"
                >
                  {procesando ? 'Procesando...' : 'Confirmar y Cerrar'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-zinc-800 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Total de la compra</span>
                  <span className="text-lg font-bold text-white">${totalCuenta.toLocaleString()}</span>
                </div>
                {cubiertoPrevios > 0.01 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Ya cobrado (otros métodos)</span>
                    <span className="text-green-400">${cubiertoPrevios.toLocaleString()}</span>
                  </div>
                )}
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Monto a cuenta corriente ($)</label>
                  <input
                    type="number"
                    min="0"
                    max={maxMontoCuenta}
                    step="1"
                    value={montoCuenta || ''}
                    onChange={(e) => setMontoCuenta(parseFloat(e.target.value) || 0)}
                    className="w-full bg-zinc-900 rounded-lg px-4 py-3 text-amber-400 font-bold focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setMontoCuenta(maxMontoCuenta)}
                      className="flex-1 text-xs bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 rounded-lg px-3 py-2 border border-amber-600/40"
                    >
                      {cubiertoPrevios > 0.01 ? 'Todo el pendiente' : 'Cargar totalidad'}
                    </button>
                    {maxMontoCuenta > 0 && cubiertoPrevios < 0.01 && (
                      <button
                        type="button"
                        onClick={() => setMontoCuenta(Math.round((maxMontoCuenta / 2) * 100) / 100)}
                        className="flex-1 text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg px-3 py-2"
                      >
                        Mitad
                      </button>
                    )}
                  </div>
                </div>
                {haySaldoRestante && (
                  <div className="pt-3 border-t border-zinc-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-400">Saldo a cobrar ahora</span>
                      <span className="font-bold text-white">${saldoRestante.toLocaleString()}</span>
                    </div>
                    <select
                      value={metodoRestante}
                      onChange={(e) => setMetodoRestante(e.target.value)}
                      className="w-full bg-zinc-900 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-600"
                    >
                      <option value="">Método del saldo...</option>
                      {metodosPago.map((metodo) => (
                        <option key={metodo.id} value={metodo.nombre}>
                          {metodo.nombre}
                          {metodo.recargo !== 0 &&
                            ` (${metodo.recargo > 0 ? '+' : ''}${metodo.recargo}%)`}
                        </option>
                      ))}
                    </select>
                    {recargoRestante !== 0 && (
                      <p className="text-xs text-red-400">
                        Recargo del saldo: {recargoRestante > 0 ? '+' : ''}$
                        {recargoRestante.toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
                {!haySaldoRestante && montoCuentaNum > 0.01 && montoCuentaNum >= maxMontoCuenta - 0.01 && (
                  <p className="text-xs text-amber-400/80 pt-1">
                    {cubiertoPrevios > 0.01
                      ? 'El saldo pendiente se cargará a la cuenta.'
                      : 'Se cargará el total a la cuenta.'}
                  </p>
                )}
                {montoCuentaNum > maxMontoCuenta + 0.01 && (
                  <p className="text-xs text-yellow-500">
                    El monto no puede superar ${maxMontoCuenta.toLocaleString()}.
                  </p>
                )}
              </div>

              {pasoCuenta === 'dni' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">DNI del cliente</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={documento}
                      onChange={(e) => setDocumento(e.target.value.replace(/\D/g, ''))}
                      placeholder="Ej: 30123456"
                      className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-600"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={handleBuscarDocumento}
                    disabled={buscando || montoCuentaNum <= 0.01 || montoCuentaNum > maxMontoCuenta + 0.01}
                    className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition-colors rounded-lg py-3 font-medium flex items-center justify-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    {buscando ? 'Buscando...' : 'Buscar cliente'}
                  </button>
                </div>
              )}

              {pasoCuenta === 'crear' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-amber-400 text-sm">
                    <UserPlus className="w-4 h-4" />
                    No hay cuenta con ese DNI. Creá el cliente:
                  </div>
                  {['nombre', 'apellido', 'documento', 'telefono'].map((campo) => (
                    <div key={campo}>
                      <label className="block text-sm text-zinc-400 mb-2 capitalize">
                        {campo === 'telefono' ? 'Teléfono / contacto' : campo === 'documento' ? 'DNI' : campo}
                      </label>
                      <input
                        type="text"
                        inputMode={campo === 'documento' || campo === 'telefono' ? 'numeric' : 'text'}
                        value={formNuevo[campo]}
                        onChange={(e) =>
                          setFormNuevo((prev) => ({
                            ...prev,
                            [campo]:
                              campo === 'documento'
                                ? e.target.value.replace(/\D/g, '')
                                : e.target.value,
                          }))
                        }
                        className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-600"
                      />
                    </div>
                  ))}
                  <button
                    onClick={handleCrearCliente}
                    disabled={procesando}
                    className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition-colors rounded-lg py-3 font-medium"
                  >
                    {procesando ? 'Creando...' : 'Crear y continuar'}
                  </button>
                </div>
              )}

              {pasoCuenta === 'confirmar' && cliente && (
                <div className="space-y-4">
                  <div className="bg-zinc-800 rounded-lg p-4 space-y-2">
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">Cliente</p>
                    <p className="text-lg font-bold text-white">
                      {cliente.nombre} {cliente.apellido}
                    </p>
                    <p className="text-sm text-zinc-400">DNI {cliente.documento}</p>
                    <p className="text-sm text-zinc-400">Tel. {cliente.telefono}</p>
                  </div>
                  <div className="text-sm text-zinc-400 space-y-1">
                    <p>
                      A cuenta:{' '}
                      <span className="text-amber-400 font-bold">
                        ${Math.min(montoCuentaNum, maxMontoCuenta).toLocaleString()}
                      </span>
                    </p>
                    {cubiertoPrevios > 0.01 && (
                      <p>
                        Ya cobrado:{' '}
                        <span className="text-white font-bold">
                          ${cubiertoPrevios.toLocaleString()}
                        </span>
                      </p>
                    )}
                    {haySaldoRestante && (
                      <p>
                        Cobra ahora ({metodoRestante || '—'}):{' '}
                        <span className="text-white font-bold">
                          ${(saldoRestante + recargoRestante).toLocaleString()}
                        </span>
                      </p>
                    )}
                  </div>
                  {haySaldoRestante && !metodoPagoValido(metodoRestante) && (
                    <p className="text-sm text-yellow-500">Seleccioná el método para el saldo a cobrar ahora.</p>
                  )}
                  <button
                    onClick={handleConfirmarCuenta}
                    disabled={procesando || !puedeConfirmarCuenta}
                    className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition-colors rounded-lg py-4 font-medium"
                  >
                    {procesando ? 'Cargando...' : 'Confirmar carga a cuenta'}
                  </button>
                </div>
              )}

              {errorMsg && (
                <div className="bg-red-900/40 border border-red-700 text-red-200 rounded-lg px-4 py-3 text-sm">
                  {errorMsg}
                </div>
              )}
            </>
          )}
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
