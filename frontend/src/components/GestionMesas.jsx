import { useState } from 'react';
import { ArrowLeft, Plus, Calendar, Trash2 } from 'lucide-react';
import { BotonImprimirVenta } from './BotonImprimirVenta.jsx';
import { useImprimirVentaTicket } from '../hooks/useImprimirVentaTicket.jsx';

export function GestionMesas({
  onVolver,
  mesas,
  cargaMesas,
  ventasMesa,
  metodosPago,
  onAbrirMesa,
  onCrearMesa,
  onEliminarMesa,
  esAdministrador,
}) {
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [mesaAEliminar, setMesaAEliminar] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const { imprimirVenta, TicketOculto } = useImprimirVentaTicket(metodosPago);

  const getEstadoMesa = (numeroMesa) => {
    const productos = cargaMesas[numeroMesa];
    if (productos && productos.length > 0) return 'ocupada';
    return 'libre';
  };

  const handleAgregarMesa = async () => {
    setErrorMsg(null);
    setProcesando(true);
    try {
      await onCrearMesa();
    } catch (err) {
      setErrorMsg(err.message || 'Error al crear mesa');
    } finally {
      setProcesando(false);
    }
  };

  const confirmarEliminarMesa = async () => {
    if (mesaAEliminar == null) return;
    setErrorMsg(null);
    setProcesando(true);
    try {
      await onEliminarMesa(mesaAEliminar);
      setMesaAEliminar(null);
    } catch (err) {
      setErrorMsg(err.message || 'Error al eliminar mesa');
    } finally {
      setProcesando(false);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'libre':
        return 'bg-green-500';
      case 'ocupada':
        return 'bg-red-500';
      case 'cerrando':
        return 'bg-yellow-500';
      default:
        return 'bg-zinc-500';
    }
  };

  const ventasFiltradas = fechaFiltro
    ? ventasMesa.filter((v) => new Date(v.fecha).toISOString().split('T')[0] === fechaFiltro)
    : ventasMesa;

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const ultimaMesaId = mesas.reduce((max, m) => (m.id > max ? m.id : max), 0);

  return (
    <div className="flex-1 flex flex-col bg-black text-white">
      <header className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 border-b border-zinc-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <button onClick={onVolver} className="hover:bg-zinc-800 p-2 rounded-lg transition-colors shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Gestión de Mesas</h1>
              <p className="text-sm text-zinc-500 uppercase tracking-wide mt-1">
                Club 22 - Control de Mesas
              </p>
            </div>
          </div>
          {esAdministrador && (
            <button
              onClick={handleAgregarMesa}
              disabled={procesando}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors px-4 sm:px-6 py-3 rounded-lg flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nueva Mesa
            </button>
          )}
        </div>
        {errorMsg && (
          <div className="mt-4 bg-red-900/40 border border-red-700 text-red-200 rounded-lg px-4 py-3 text-sm">
            {errorMsg}
          </div>
        )}
      </header>

      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Estado de Mesas</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {mesas.map((mesa) => {
              const esUltimaMesa = mesa.id === ultimaMesaId;
              const estadoReal = getEstadoMesa(mesa.numero);

              return (
                <div
                  key={mesa.id}
                  className="bg-zinc-900 hover:bg-zinc-800 transition-colors rounded-lg border border-zinc-800 relative overflow-hidden"
                >
                  <button onClick={() => onAbrirMesa(mesa.numero)} className="w-full p-6 text-left">
                    <div
                      className={`absolute top-4 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full ${getEstadoColor(estadoReal)}`}
                    ></div>
                    <p className="text-lg font-medium mt-4 mb-1">Mesa {mesa.numero}</p>
                    <p className="text-sm text-zinc-400 capitalize">{estadoReal}</p>
                  </button>

                  {esUltimaMesa && esAdministrador && (
                    <div className="absolute right-2 top-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMesaAEliminar(mesa.id);
                        }}
                        className="w-6 h-6 rounded bg-red-600/20 hover:bg-red-600/30 flex items-center justify-center transition-colors text-red-500"
                        title="Eliminar mesa"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-zinc-400">Libre</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-zinc-400">Ocupada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <span className="text-zinc-400">Cerrando</span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">Historial de Mesas Cerradas (caja actual)</h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <label className="text-sm text-zinc-400">Filtrar por fecha:</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                <input
                  type="date"
                  value={fechaFiltro}
                  onChange={(e) => setFechaFiltro(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
              {fechaFiltro && (
                <button onClick={() => setFechaFiltro('')} className="text-sm text-red-500 hover:text-red-400">
                  Limpiar
                </button>
              )}
            </div>
          </div>

          <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">Mesa</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">Fecha y Hora</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">Total</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasFiltradas.map((venta) => (
                    <tr key={venta.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium">Mesa {venta.numeroMesa}</td>
                      <td className="px-6 py-4 text-zinc-400">{formatearFecha(venta.fecha)}</td>
                      <td className="px-6 py-4">
                        <span className="text-green-500 font-medium">${venta.total.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <BotonImprimirVenta onClick={() => imprimirVenta(venta)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {ventasFiltradas.length === 0 && (
                <div className="text-center py-12 text-zinc-500">
                  {fechaFiltro ? 'No hay mesas cerradas en esta fecha' : 'No hay mesas cerradas en la caja actual'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {mesaAEliminar !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-lg w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">Confirmar Eliminación</h3>
            <p className="text-zinc-400 mb-6">¿Estás seguro de que deseas eliminar esta mesa?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setMesaAEliminar(null)}
                disabled={procesando}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 transition-colors rounded-lg py-3 font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminarMesa}
                disabled={procesando}
                className="flex-1 bg-red-600 hover:bg-red-700 transition-colors rounded-lg py-3 font-medium disabled:opacity-50"
              >
                {procesando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <TicketOculto />
    </div>
  );
}
