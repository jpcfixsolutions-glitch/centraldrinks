import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Search,
  Wallet,
  User,
  ShoppingBag,
  ArrowDown,
  ArrowUp,
  Phone,
  FileText,
} from 'lucide-react';
import { cuentasCorrientesApi } from '../lib/api.js';
import { formatearFechaCorta, formatearHora } from '../lib/fechas.js';

export function CuentasCorrientes({ onVolver, metodosPago = [], onPagoRegistrado }) {
  const [cuentas, setCuentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [seleccionada, setSeleccionada] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [showPago, setShowPago] = useState(false);
  const [montoPago, setMontoPago] = useState('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [procesandoPago, setProcesandoPago] = useState(false);

  const metodosDisponibles = useMemo(() => {
    const activos = (metodosPago || []).filter((m) => m.activo !== false).map((m) => m.nombre);
    if (activos.length === 0) return ['Efectivo', 'Virtual'];
    return activos;
  }, [metodosPago]);

  const cargarLista = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await cuentasCorrientesApi.listar();
      setCuentas(data);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las cuentas');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarLista();
  }, [cargarLista]);

  useEffect(() => {
    if (metodosDisponibles.length > 0 && !metodosDisponibles.includes(metodoPago)) {
      setMetodoPago(metodosDisponibles[0]);
    }
  }, [metodosDisponibles, metodoPago]);

  const cuentasFiltradas = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    if (!term) return cuentas;
    return cuentas.filter(
      (c) =>
        c.nombreCompleto?.toLowerCase().includes(term) ||
        c.documento?.includes(term) ||
        c.telefono?.includes(term)
    );
  }, [cuentas, busqueda]);

  const abrirDetalle = async (cuenta) => {
    setSeleccionada(cuenta);
    setDetalle(null);
    setCargandoDetalle(true);
    setShowPago(false);
    setError(null);
    try {
      const data = await cuentasCorrientesApi.obtener(cuenta.id);
      setDetalle(data);
    } catch (err) {
      setError(err.message || 'No se pudo cargar el detalle');
    } finally {
      setCargandoDetalle(false);
    }
  };

  const volverLista = () => {
    setSeleccionada(null);
    setDetalle(null);
    setShowPago(false);
    cargarLista();
  };

  const handleRegistrarPago = async () => {
    if (!seleccionada) return;
    const monto = parseFloat(montoPago);
    if (!Number.isFinite(monto) || monto <= 0) {
      setError('Ingresá un monto válido');
      return;
    }
    setProcesandoPago(true);
    setError(null);
    try {
      await cuentasCorrientesApi.registrarPago(seleccionada.id, {
        monto,
        metodoPago,
      });
      setShowPago(false);
      setMontoPago('');
      const data = await cuentasCorrientesApi.obtener(seleccionada.id);
      setDetalle(data);
      await cargarLista();
      if (onPagoRegistrado) await onPagoRegistrado();
    } catch (err) {
      setError(err.message || 'No se pudo registrar el pago');
    } finally {
      setProcesandoPago(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-black text-white">
      <header className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 border-b border-zinc-800 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            onClick={seleccionada ? volverLista : onVolver}
            className="hover:bg-zinc-800 p-2 rounded-lg transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">
              {seleccionada
                ? detalle?.cliente?.nombreCompleto || seleccionada.nombreCompleto
                : 'Cuentas Corrientes'}
            </h1>
            <p className="text-zinc-400 text-sm">
              {seleccionada
                ? `DNI ${detalle?.cliente?.documento || seleccionada.documento}`
                : 'Deudas, consumos y pagos'}
            </p>
          </div>
        </div>
        {seleccionada && detalle && detalle.deuda > 0 && (
          <button
            onClick={() => {
              setShowPago(true);
              setMontoPago(String(detalle.deuda));
              setError(null);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 transition-colors rounded-lg px-4 py-2.5 font-medium flex items-center gap-2"
          >
            <Wallet className="w-4 h-4" />
            Registrar pago
          </button>
        )}
      </header>

      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        {error && (
          <div className="mb-4 bg-red-900/40 border border-red-700 text-red-200 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {!seleccionada ? (
          <>
            <div className="relative mb-6 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, DNI o teléfono..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            {cargando ? (
              <p className="text-zinc-500">Cargando cuentas...</p>
            ) : cuentasFiltradas.length === 0 ? (
              <div className="text-center py-16 text-zinc-500">
                <User className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No hay cuentas corrientes{busqueda ? ' con ese filtro' : ''}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cuentasFiltradas.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => abrirDetalle(c)}
                    className="w-full text-left bg-zinc-900/50 hover:bg-zinc-800/80 border border-zinc-800 rounded-xl px-4 py-4 flex items-center justify-between gap-4 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">{c.nombreCompleto}</p>
                      <p className="text-sm text-zinc-500 flex flex-wrap gap-x-3 gap-y-1 mt-1">
                        <span className="inline-flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          {c.documento}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {c.telefono}
                        </span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`text-lg font-bold ${
                          c.deuda > 0 ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      >
                        ${c.deuda.toLocaleString()}
                      </p>
                      <p className="text-xs text-zinc-500">deuda</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : cargandoDetalle ? (
          <p className="text-zinc-500">Cargando historial...</p>
        ) : detalle ? (
          <div className="space-y-6 max-w-3xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <p className="text-xs text-zinc-500 mb-1">Deuda actual</p>
                <p
                  className={`text-2xl font-bold ${
                    detalle.deuda > 0 ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  ${detalle.deuda.toLocaleString()}
                </p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 sm:col-span-2">
                <p className="text-xs text-zinc-500 mb-1">Contacto</p>
                <p className="text-white font-medium">{detalle.cliente.telefono}</p>
                <p className="text-sm text-zinc-500 mt-1">DNI {detalle.cliente.documento}</p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold mb-4">Historial</h2>
              {detalle.movimientos.length === 0 ? (
                <p className="text-zinc-500 text-sm">Sin movimientos</p>
              ) : (
                <ul className="space-y-3">
                  {detalle.movimientos.map((m) => (
                    <li
                      key={m.id}
                      className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            m.tipo === 'cargo' ? 'bg-red-500/20' : 'bg-emerald-500/20'
                          }`}
                        >
                          {m.tipo === 'cargo' ? (
                            <ArrowUp className="w-5 h-5 text-red-400" />
                          ) : (
                            <ArrowDown className="w-5 h-5 text-emerald-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-bold text-white">
                              {m.tipo === 'cargo'
                                ? `Cargo${m.codigoVenta ? ` · ${m.codigoVenta}` : ''}`
                                : `Pago · ${m.metodoPago || ''}`}
                            </p>
                            <p
                              className={`font-bold ${
                                m.tipo === 'cargo' ? 'text-red-400' : 'text-emerald-400'
                              }`}
                            >
                              {m.tipo === 'cargo' ? '+' : '-'}${m.monto.toLocaleString()}
                            </p>
                          </div>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {formatearFechaCorta(m.fecha)} · {formatearHora(m.fecha)}
                          </p>
                          {m.tipo === 'cargo' && m.productos?.length > 0 && (
                            <ul className="mt-3 space-y-1 border-t border-zinc-800 pt-3">
                              {m.productos.map((p, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-center justify-between text-sm gap-2"
                                >
                                  <span className="text-zinc-300 flex items-center gap-2 min-w-0">
                                    <ShoppingBag className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                                    <span className="truncate">
                                      {p.cantidad}× {p.nombre}
                                    </span>
                                  </span>
                                  <span className="text-zinc-400 shrink-0">
                                    ${(p.precio * p.cantidad).toLocaleString()}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {showPago && detalle && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-lg w-full max-w-md border border-zinc-800 p-6 space-y-4">
            <h3 className="text-xl font-bold">Registrar pago</h3>
            <p className="text-sm text-zinc-400">
              Deuda actual: <span className="text-red-400 font-bold">${detalle.deuda.toLocaleString()}</span>
            </p>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Monto ($)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={montoPago}
                onChange={(e) => setMontoPago(e.target.value)}
                className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Método de pago</label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {metodosDisponibles.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowPago(false)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg py-3 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegistrarPago}
                disabled={procesandoPago}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg py-3 font-medium"
              >
                {procesandoPago ? 'Guardando...' : 'Confirmar pago'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
