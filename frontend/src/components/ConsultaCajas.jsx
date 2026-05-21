import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Eye, DollarSign, Receipt, Lock, Wallet, CreditCard } from 'lucide-react';
import { cajasApi } from '../lib/api.js';

export function ConsultaCajas({ onVolver, cierres, ventasAbiertas, cajaActual, onCerrarCaja }) {
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [empleadoFiltro, setEmpleadoFiltro] = useState('todos');
  const [cajaSeleccionada, setCajaSeleccionada] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [procesando, setProcesando] = useState(false);

  const empleadosDisponibles = ['todos', ...Array.from(new Set(cierres.map((c) => c.empleado)))];

  const cierresFiltrados = cierres.filter((cierre) => {
    const fechaMatch = fechaFiltro
      ? new Date(cierre.fechaCierre).toISOString().split('T')[0] === fechaFiltro
      : true;
    const empleadoMatch = empleadoFiltro === 'todos' || cierre.empleado === empleadoFiltro;
    return fechaMatch && empleadoMatch;
  });

  const cajaActualTotal = ventasAbiertas.reduce((sum, v) => sum + v.total, 0);

  const formatearFechaHora = (fecha) =>
    new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

  const resumen = cajaActual?.resumen;

  const handleCerrarCaja = async () => {
    const msgResumen = resumen
      ? `\n\nArqueo esperado:\n• Efectivo en caja: $${resumen.efectivoEsperado.toLocaleString()}\n• Virtual/Transferencias: $${resumen.ingresoVirtual.toLocaleString()}`
      : '';
    if (
      !confirm(
        `¿Cerrar caja con ${ventasAbiertas.length} ventas ($${cajaActualTotal.toLocaleString()})?${msgResumen}\n\nContá el efectivo y verificá que coincida.`
      )
    )
      return;
    setErrorMsg(null);
    setProcesando(true);
    try {
      await onCerrarCaja();
    } catch (err) {
      setErrorMsg(err.message || 'Error al cerrar la caja');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <>
      <div className="flex-1 flex flex-col bg-black text-white">
        <header className="px-8 py-6 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={onVolver} className="hover:bg-zinc-800 p-2 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Consulta de Cajas</h1>
                <p className="text-sm text-zinc-500 mt-1">Historial de cierres de caja</p>
              </div>
            </div>
            <button
              onClick={handleCerrarCaja}
              disabled={procesando || !cajaActual?.abierta}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors px-6 py-3 rounded-lg flex items-center gap-2"
            >
              <Lock className="w-5 h-5" />
              {procesando ? 'Cerrando...' : 'Cerrar Caja Actual'}
            </button>
          </div>
          {errorMsg && (
            <div className="mt-4 bg-red-900/40 border border-red-700 text-red-200 rounded-lg px-4 py-3 text-sm">
              {errorMsg}
            </div>
          )}
        </header>

        <div className="flex-1 p-8 overflow-auto">
          {cajaActual?.abierta && resumen && (
            <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-bold text-green-500 mb-4">Caja abierta — Arqueo actual</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
                  <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
                    <Wallet className="w-4 h-4 text-emerald-500" />
                    Efectivo esperado
                  </div>
                  <p className="text-2xl font-bold text-emerald-500">
                    ${resumen.efectivoEsperado.toLocaleString()}
                  </p>
                  <p className="text-xs text-zinc-500 mt-2">
                    Inicial ${(cajaActual.sesion?.efectivoInicial || 0).toLocaleString()} + ventas $
                    {resumen.ingresoEfectivo.toLocaleString()}
                    {resumen.egresoEfectivo > 0 && ` − gastos $${resumen.egresoEfectivo.toLocaleString()}`}
                  </p>
                </div>
                <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
                  <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
                    <CreditCard className="w-4 h-4 text-blue-500" />
                    Virtual / Transferencias
                  </div>
                  <p className="text-2xl font-bold text-blue-500">
                    ${resumen.ingresoVirtual.toLocaleString()}
                  </p>
                </div>
                <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
                  <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
                    <DollarSign className="w-4 h-4 text-red-500" />
                    Total ventas
                  </div>
                  <p className="text-2xl font-bold text-white">${resumen.ingresoTotal.toLocaleString()}</p>
                  <p className="text-xs text-zinc-500 mt-2">{resumen.cantidadVentas} tickets</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6 mb-6">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">Filtros</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Fecha</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <input
                    type="date"
                    value={fechaFiltro}
                    onChange={(e) => setFechaFiltro(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Empleado</label>
                <select
                  value={empleadoFiltro}
                  onChange={(e) => setEmpleadoFiltro(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  {empleadosDisponibles.map((emp) => (
                    <option key={emp} value={emp}>
                      {emp === 'todos' ? 'Todos los empleados' : emp}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">Fecha y Hora</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">Caja</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">Empleado</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">Cant. Ventas</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">Ingreso Total</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cierresFiltrados.map((cierre) => (
                    <tr key={cierre.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4 text-zinc-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {formatearFechaHora(cierre.fechaCierre)}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">{cierre.caja}</td>
                      <td className="px-6 py-4 text-blue-500">{cierre.empleado}</td>
                      <td className="px-6 py-4">{cierre.cantidadVentas}</td>
                      <td className="px-6 py-4 text-green-500 font-medium">
                        ${cierre.ingresoTotal.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setCajaSeleccionada(cierre.id)}
                          className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {cierresFiltrados.length === 0 && (
                <div className="text-center py-12 text-zinc-500">No hay cierres de caja para mostrar</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {cajaSeleccionada != null && (
        <DetalleCajaModal cierreId={cajaSeleccionada} onClose={() => setCajaSeleccionada(null)} />
      )}
    </>
  );
}

function DetalleCajaModal({ cierreId, onClose }) {
  const [cierre, setCierre] = useState(null);
  const [tipoVista, setTipoVista] = useState('mostrador');
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;
    cajasApi
      .obtener(cierreId)
      .then((data) => {
        if (!cancelado) setCierre(data);
      })
      .catch((err) => {
        if (!cancelado) setError(err.message || 'Error al cargar el cierre');
      });
    return () => {
      cancelado = true;
    };
  }, [cierreId]);

  const formatearFecha = (fecha) =>
    new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const formatearHora = (fecha) =>
    new Date(fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-zinc-900 rounded-lg w-full max-w-md p-6">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={onClose} className="bg-zinc-800 hover:bg-zinc-700 rounded-lg px-4 py-2">
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  if (!cierre) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-zinc-900 rounded-lg p-6">
          <p className="text-zinc-400">Cargando detalle...</p>
        </div>
      </div>
    );
  }

  const ventas = cierre.ventas || [];
  const ventasFiltradas = ventas.filter((v) => v.tipo === tipoVista);

  const resumenProductosMostrador = ventas
    .filter((v) => v.tipo === 'mostrador')
    .reduce((acc, venta) => {
      (venta.productos || []).forEach((producto) => {
        const key = producto.nombre;
        if (!acc[key]) {
          acc[key] = { nombre: producto.nombre, cantidad: 0, recaudacion: 0 };
        }
        acc[key].cantidad += producto.cantidad;
        acc[key].recaudacion += producto.cantidad * producto.precio;
      });
      return acc;
    }, {});

  const resumenProductosMesas = ventas
    .filter((v) => v.tipo === 'mesa')
    .flatMap((venta) =>
      (venta.productos || []).map((producto) => ({
        nombre: producto.nombre,
        cantidad: producto.cantidad,
        recaudacion: producto.cantidad * producto.precio,
        mesa: venta.numeroMesa || 0,
      }))
    );

  const productosArrayMostrador = Object.values(resumenProductosMostrador);
  const totalMostrador = productosArrayMostrador.reduce((sum, p) => sum + p.recaudacion, 0);
  const totalMesas = resumenProductosMesas.reduce((sum, p) => sum + p.recaudacion, 0);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Detalle de Caja: {cierre.caja}</h2>
              <div className="flex items-center gap-4 text-sm text-zinc-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatearFecha(cierre.fechaCierre)} - {formatearHora(cierre.fechaCierre)}
                </div>
                <span>•</span>
                <span>Atendió: {cierre.empleado}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
              <span className="text-2xl text-zinc-400">×</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-sm text-zinc-400">Total Tickets</p>
              </div>
              <p className="text-3xl font-bold">{ventas.length}</p>
            </div>

            <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-sm text-zinc-400">Ingreso Total</p>
              </div>
              <p className="text-3xl font-bold text-green-500">
                ${(cierre.ingresoTotal ?? ventas.reduce((sum, v) => sum + v.total, 0)).toLocaleString()}
              </p>
            </div>
          </div>

          {(cierre.efectivoInicial > 0 || cierre.ingresoEfectivo > 0) && (
            <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700 mb-6">
              <h4 className="font-bold text-white mb-3">Arqueo al cierre</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-zinc-500">Efectivo inicial</p>
                  <p className="font-medium">${(cierre.efectivoInicial || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-zinc-500">+ Ventas efectivo</p>
                  <p className="font-medium text-emerald-500">
                    ${(cierre.ingresoEfectivo || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500">Virtual / Transf.</p>
                  <p className="font-medium text-blue-500">
                    ${(cierre.ingresoVirtual || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500">Efectivo esperado</p>
                  <p className="font-bold text-emerald-400">
                    ${(cierre.efectivoEsperado ?? (cierre.efectivoInicial || 0) + (cierre.ingresoEfectivo || 0) - (cierre.egresoEfectivo || 0)).toLocaleString()}
                  </p>
                </div>
              </div>
              {(cierre.egresoEfectivo || 0) > 0 && (
                <p className="text-xs text-red-400 mt-2">
                  Gastos en efectivo del turno: −${cierre.egresoEfectivo.toLocaleString()}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">
              Resumen de productos en {tipoVista === 'mostrador' ? 'Mostrador' : 'Mesas'}
            </h3>
            <div className="flex items-center gap-2 bg-zinc-800 p-1 rounded-lg border border-zinc-700">
              <button
                onClick={() => setTipoVista('mostrador')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  tipoVista === 'mostrador' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Mostrador
              </button>
              <button
                onClick={() => setTipoVista('mesa')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  tipoVista === 'mesa' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Mesas
              </button>
            </div>
          </div>

          {tipoVista === 'mostrador' && productosArrayMostrador.length > 0 && (
            <div className="mb-6 bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-700">
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Producto</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Cant.</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Recaudación</th>
                  </tr>
                </thead>
                <tbody>
                  {productosArrayMostrador.map((producto, idx) => (
                    <tr key={idx} className="border-b border-zinc-700/50 last:border-0">
                      <td className="px-4 py-3">{producto.nombre}</td>
                      <td className="px-4 py-3">{producto.cantidad}</td>
                      <td className="px-4 py-3 font-medium">${producto.recaudacion.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="bg-zinc-700/30 font-bold">
                    <td className="px-4 py-3" colSpan={2}>TOTAL</td>
                    <td className="px-4 py-3 text-green-500">${totalMostrador.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {tipoVista === 'mesa' && resumenProductosMesas.length > 0 && (
            <div className="mb-6 bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-700">
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Producto</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Mesa</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Cant.</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Recaudación</th>
                  </tr>
                </thead>
                <tbody>
                  {resumenProductosMesas.map((producto, idx) => (
                    <tr key={idx} className="border-b border-zinc-700/50 last:border-0">
                      <td className="px-4 py-3">{producto.nombre}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-blue-600/20 text-blue-500 rounded text-xs font-medium">
                          Mesa {producto.mesa}
                        </span>
                      </td>
                      <td className="px-4 py-3">{producto.cantidad}</td>
                      <td className="px-4 py-3 font-medium">${producto.recaudacion.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="bg-zinc-700/30 font-bold">
                    <td className="px-4 py-3" colSpan={3}>TOTAL</td>
                    <td className="px-4 py-3 text-green-500">${totalMesas.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {((tipoVista === 'mostrador' && productosArrayMostrador.length === 0) ||
            (tipoVista === 'mesa' && resumenProductosMesas.length === 0)) && (
            <div className="mb-6 bg-zinc-800 rounded-lg border border-zinc-700 p-8 text-center text-zinc-500">
              No hay ventas en {tipoVista === 'mostrador' ? 'mostrador' : 'mesas'} para este cierre
            </div>
          )}

          {ventasFiltradas.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-4">Detalle por Ticket</h3>
              <div className="space-y-4">
                {ventasFiltradas.map((venta) => (
                  <div key={venta.id} className="bg-zinc-800 rounded-lg border border-zinc-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <span className="text-blue-500 font-bold">#{venta.codigo}</span>
                        <span className="text-sm text-zinc-400">
                          {formatearHora(venta.fecha)}
                        </span>
                        {venta.tipo === 'mesa' && venta.numeroMesa && (
                          <span className="px-2 py-1 bg-blue-600/20 text-blue-500 rounded text-xs font-medium">
                            Mesa {venta.numeroMesa}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">${venta.total.toLocaleString()}</p>
                        <p className="text-sm text-zinc-400 uppercase">{venta.metodoPago}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {(venta.productos || []).map((producto, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-zinc-300">
                            {producto.cantidad}x {producto.nombre}
                          </span>
                          <span className="text-zinc-400">
                            ${(producto.cantidad * producto.precio).toLocaleString()}
                          </span>
                        </div>
                      ))}
                      {venta.descuento > 0 && (
                        <div className="flex justify-between text-sm text-green-500">
                          <span>Descuento</span>
                          <span>-${venta.descuento.toLocaleString()}</span>
                        </div>
                      )}
                      {venta.pagos?.map((p, idx) =>
                        p.recargo !== 0 ? (
                          <div key={idx} className="flex justify-between text-sm text-red-400">
                            <span>Recargo {p.metodoPago}</span>
                            <span>+${p.recargo.toLocaleString()}</span>
                          </div>
                        ) : null
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="w-full md:w-auto px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
