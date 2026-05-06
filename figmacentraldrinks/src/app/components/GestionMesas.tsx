import { useState } from 'react';
import { ArrowLeft, Plus, Calendar, Trash2 } from 'lucide-react';

interface Mesa {
  id: number;
  estado: 'libre' | 'ocupada' | 'cerrando';
}

interface MesaCerrada {
  id: number;
  numeroMesa: number;
  fecha: Date;
  total: number;
}

interface EstadoMesa {
  numeroMesa: number;
  productos: any[];
  totalAcumulado: number;
}

interface GestionMesasProps {
  onVolver: () => void;
  onAbrirMesa: (numeroMesa: number) => void;
  mesasCerradas: MesaCerrada[];
  estadoMesas: Record<number, EstadoMesa>;
  esAdministrador: boolean;
}

export function GestionMesas({ onVolver, onAbrirMesa, mesasCerradas, estadoMesas, esAdministrador }: GestionMesasProps) {
  const [mesas, setMesas] = useState<Mesa[]>(Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    estado: 'libre'
  })));
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [mesaAEliminar, setMesaAEliminar] = useState<number | null>(null);

  // Función para obtener el estado real de la mesa
  const getEstadoMesa = (mesaId: number): Mesa['estado'] => {
    const estado = estadoMesas[mesaId];
    if (estado && estado.productos.length > 0) {
      return 'ocupada';
    }
    return 'libre';
  };

  const agregarNuevaMesa = () => {
    const nuevoId = Math.max(...mesas.map(m => m.id)) + 1;
    setMesas(prev => [...prev, { id: nuevoId, estado: 'libre' }]);
  };

  const confirmarEliminarMesa = () => {
    if (mesaAEliminar !== null) {
      setMesas(prev => prev.filter(m => m.id !== mesaAEliminar));
      setMesaAEliminar(null);
    }
  };

  const getEstadoColor = (estado: Mesa['estado']) => {
    switch (estado) {
      case 'libre': return 'bg-green-500';
      case 'ocupada': return 'bg-red-500';
      case 'cerrando': return 'bg-yellow-500';
    }
  };

  const mesasCerradasFiltradas = fechaFiltro
    ? mesasCerradas.filter(m => {
        const fechaMesa = new Date(m.fecha).toISOString().split('T')[0];
        return fechaMesa === fechaFiltro;
      })
    : mesasCerradas;

  const formatearFecha = (fecha: Date) => {
    return new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-black text-white">
      {/* Header */}
      <header className="px-8 py-6 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onVolver}
              className="hover:bg-zinc-800 p-2 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Gestión de Mesas</h1>
              <p className="text-sm text-zinc-500 uppercase tracking-wide mt-1">
                Centraldrinks - Control de Mesas
              </p>
            </div>
          </div>
          {esAdministrador && (
            <button
              onClick={agregarNuevaMesa}
              className="bg-red-600 hover:bg-red-700 transition-colors px-6 py-3 rounded-lg flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nueva Mesa
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-8 overflow-auto">
        {/* Estado de Mesas */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Estado de Mesas</h2>

          {/* Mesas Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {mesas.map((mesa) => {
              const esUltimaMesa = mesa.id === Math.max(...mesas.map(m => m.id));
              const estadoReal = getEstadoMesa(mesa.id);

              return (
                <div
                  key={mesa.id}
                  className="bg-zinc-900 hover:bg-zinc-800 transition-colors rounded-lg border border-zinc-800 relative overflow-hidden"
                >
                  {/* Área principal clickeable */}
                  <button
                    onClick={() => onAbrirMesa(mesa.id)}
                    className="w-full p-6 text-left"
                  >
                    <div className={`absolute top-4 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full ${getEstadoColor(estadoReal)}`}></div>
                    <p className="text-lg font-medium mt-4 mb-1">Mesa {mesa.id}</p>
                    <p className="text-sm text-zinc-400 capitalize">{estadoReal}</p>
                  </button>

                  {/* Botón eliminar (solo última mesa y solo administrador) */}
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

          {/* Legend */}
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

        {/* Historial de Mesas Cerradas */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Historial de Mesas Cerradas</h2>
            <div className="flex items-center gap-3">
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
                <button
                  onClick={() => setFechaFiltro('')}
                  className="text-sm text-red-500 hover:text-red-400"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">
                      Mesa
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">
                      Fecha y Hora
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mesasCerradasFiltradas.map(mesa => (
                    <tr key={mesa.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium">Mesa {mesa.numeroMesa}</td>
                      <td className="px-6 py-4 text-zinc-400">{formatearFecha(mesa.fecha)}</td>
                      <td className="px-6 py-4">
                        <span className="text-green-500 font-medium">${mesa.total.toLocaleString()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {mesasCerradasFiltradas.length === 0 && (
                <div className="text-center py-12 text-zinc-500">
                  {fechaFiltro ? 'No hay mesas cerradas en esta fecha' : 'No hay mesas cerradas aún'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación */}
      {mesaAEliminar !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-lg w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">Confirmar Eliminación</h3>
            <p className="text-zinc-400 mb-6">
              ¿Estás seguro de que deseas eliminar la Mesa {mesaAEliminar}?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setMesaAEliminar(null)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 transition-colors rounded-lg py-3 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminarMesa}
                className="flex-1 bg-red-600 hover:bg-red-700 transition-colors rounded-lg py-3 font-medium"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
