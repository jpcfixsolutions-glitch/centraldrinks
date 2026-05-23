import { useState, useMemo } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, CreditCard, Wallet, Calendar, Receipt, Activity, Plus, X, List, Package, RefreshCw } from 'lucide-react';

export function Stats({ onVolver, ventas, gastosFijos = [], gastos = [], productos = [], onCrearGasto }) {
  const [rangoTiempo, setRangoTiempo] = useState('mes');
  const [showGastoModal, setShowGastoModal] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const totalInvertido = useMemo(() => {
    return productos.reduce((sum, p) => sum + (p.stock * (p.costoUnitario || 0)), 0);
  }, [productos]);

  const {
    ingresosTotales,
    ingresosEfectivo,
    ingresosVirtuales,
    gastosFijosMensuales,
    gastosVariables,
    gastosOperativos,
    costoReposicion,
    movimientos
  } = useMemo(() => {
    const ahora = new Date();
    const fechaInicio = new Date();
    
    if (rangoTiempo === 'semana') {
      fechaInicio.setDate(ahora.getDate() - 7);
    } else {
      fechaInicio.setMonth(ahora.getMonth() - 1);
    }

    const ventasFiltradas = ventas.filter(v => new Date(v.fecha) >= fechaInicio);
    const gastosFiltrados = gastos.filter(g => new Date(g.fecha) >= fechaInicio);

    let total = 0;
    let efectivo = 0;
    let virtual = 0;
    let reposicion = 0;

    ventasFiltradas.forEach(v => {
      total += v.total;
      
      const esEfectivo = v.metodoPago.toLowerCase() === 'efectivo';
      if (esEfectivo) efectivo += v.total;
      else virtual += v.total;

      const itemsVenta = v.productos || v.items || [];
      itemsVenta.forEach(vp => {
        const nombreBuscado = vp.nombre || vp.nombreProducto;
        const prodOriginal = productos.find(p => p.nombre === nombreBuscado);
        const costo = prodOriginal ? (prodOriginal.costoUnitario || 0) : 0;
        reposicion += costo * vp.cantidad;
      });
    });

    const gastosEfectivo = gastosFiltrados.filter(g => g.metodo === 'Efectivo').reduce((sum, g) => sum + g.monto, 0);
    const gastosVirtuales = gastosFiltrados.filter(g => g.metodo === 'Virtual').reduce((sum, g) => sum + g.monto, 0);
    
    const totalGastosFijosMes = gastosFijos.reduce((sum, g) => sum + g.monto, 0);
    const gastosOperativosCalculado = gastosEfectivo + gastosVirtuales + totalGastosFijosMes;

    // Creamos un historial combinado de ventas y gastos ordenado por fecha (más reciente primero)
    const movimientosCombinados = [
      ...ventasFiltradas.map(v => ({
        id: `v-${v.id}`,
        fechaOriginal: new Date(v.fecha),
        tipo: 'ingreso',
        asunto: `Venta ${v.tipo === 'mostrador' ? 'Mostrador' : 'Mesa'} #${v.codigo || v.id}`,
        metodo: v.metodoPago,
        monto: v.total
      })),
      ...gastosFiltrados.map(g => ({
        id: `g-${g.id}`,
        fechaOriginal: new Date(g.fecha),
        tipo: 'egreso',
        asunto: g.asunto,
        metodo: g.metodo,
        monto: g.monto
      }))
    ].sort((a, b) => b.fechaOriginal - a.fechaOriginal);

    return {
      ingresosTotales: total,
      ingresosEfectivo: efectivo,
      ingresosVirtuales: virtual,
      gastosFijosMensuales: totalGastosFijosMes,
      gastosVariables: gastosEfectivo + gastosVirtuales,
      gastosOperativos: gastosOperativosCalculado,
      costoReposicion: reposicion,
      movimientos: movimientosCombinados
    };
  }, [ventas, gastos, rangoTiempo, gastosFijos, productos]);

  const handleGuardarGasto = async (nuevoGasto) => {
    setGuardando(true);
    try {
      await onCrearGasto(nuevoGasto);
      setShowGastoModal(false);
    } catch (err) {
      alert(err.message || 'Error al guardar el gasto');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-black text-white">
      <header className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 border-b border-zinc-800 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button onClick={onVolver} className="hover:bg-zinc-800 p-2 rounded-lg transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold">Estadísticas</h1>
            <p className="text-sm text-zinc-500 mt-1">Rendimiento financiero del negocio</p>
          </div>
        </div>
        <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800 w-full sm:w-auto">
          <button
            onClick={() => setRangoTiempo('semana')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              rangoTiempo === 'semana' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Últimos 7 días
          </button>
          <button
            onClick={() => setRangoTiempo('mes')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              rangoTiempo === 'mes' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Último Mes
          </button>
        </div>
      </header>

      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        {/* Tarjetas Principales */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Ingresos */}
          <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <TrendingUp className="w-24 h-24 text-green-500" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h2 className="text-lg font-bold text-white relative z-10">Ingresos Totales</h2>
            </div>
            <p className="text-4xl font-bold text-green-500 mb-6 relative z-10">
              ${ingresosTotales.toLocaleString()}
            </p>
            
            <div className="space-y-3 relative z-10">
              <div className="flex justify-between items-center bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Wallet className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm">Efectivo</span>
                </div>
                <span className="font-bold text-emerald-500">${ingresosEfectivo.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
                <div className="flex items-center gap-2 text-zinc-300">
                  <CreditCard className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Virtual (Transf, Tarjetas, QR)</span>
                </div>
                <span className="font-bold text-blue-500">${ingresosVirtuales.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Gastos Operativos */}
          <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <TrendingDown className="w-24 h-24 text-red-500" />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                </div>
                <h2 className="text-lg font-bold text-white relative z-10">Gastos Operativos</h2>
              </div>
              <button 
                onClick={() => setShowGastoModal(true)}
                className="relative z-10 bg-red-600 hover:bg-red-700 transition-colors w-8 h-8 rounded-lg flex items-center justify-center text-white"
                title="Registrar nuevo gasto"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <p className="text-4xl font-bold text-red-500 mb-6 relative z-10">
              ${gastosOperativos.toLocaleString()}
            </p>
            
            <div className="space-y-3 relative z-10">
              <div className="flex justify-between items-center bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Receipt className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm">Gastos Fijos (Mes)</span>
                </div>
                <span className="font-medium text-white">${gastosFijosMensuales.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
                <div className="flex items-center gap-2 text-zinc-300">
                  <DollarSign className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm">Gastos Variables / Retiros</span>
                </div>
                <span className="font-medium text-white">${gastosVariables.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Balance */}
          <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Activity className="w-24 h-24 text-purple-500" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-purple-500" />
                </div>
                <h2 className="text-lg font-bold text-white relative z-10">Balance Neto</h2>
              </div>
              <p className="text-zinc-400 text-sm mb-2 relative z-10">Ingresos Totales - Gastos Operativos</p>
            </div>
            <div className="relative z-10 bg-zinc-800/50 p-4 rounded-lg border border-zinc-700/50 text-center">
              <p className={`text-4xl font-bold ${ingresosTotales - gastosOperativos >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${(ingresosTotales - gastosOperativos).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Capital e Inventario */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Total Invertido */}
          <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Package className="w-24 h-24 text-amber-500" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white relative z-10">Capital Invertido</h2>
                <p className="text-xs text-zinc-500">Costo de la mercadería en stock</p>
              </div>
            </div>
            <p className="text-4xl font-bold text-amber-500 relative z-10">
              ${totalInvertido.toLocaleString()}
            </p>
          </div>

          {/* Costo de Reposición */}
          <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <RefreshCw className="w-24 h-24 text-cyan-500" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-cyan-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white relative z-10">Costo de Reposición</h2>
                <p className="text-xs text-zinc-500">Lo vendido {rangoTiempo === 'semana' ? 'en los últimos 7 días' : 'en el último mes'}</p>
              </div>
            </div>
            <p className="text-4xl font-bold text-cyan-500 relative z-10">
              ${costoReposicion.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Historial de Movimientos Detallado */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <List className="w-4 h-4 text-blue-500" />
            </div>
            <h2 className="text-lg font-bold text-white">Historial de Movimientos</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="text-left px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wide">Fecha y Hora</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wide">Detalle</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wide">Método</th>
                  <th className="text-right px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wide">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {movimientos.map((mov) => (
                  <tr key={mov.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-zinc-400 text-sm">
                        {mov.fechaOriginal.toLocaleString('es-ES', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                          hour12: false
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-white">{mov.asunto}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-zinc-400 uppercase">{mov.metodo}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {mov.tipo === 'ingreso' ? (
                        <span className="text-green-500 font-bold">+${mov.monto.toLocaleString()}</span>
                      ) : (
                        <span className="text-red-500 font-bold">-${mov.monto.toLocaleString()}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {movimientos.length === 0 && (
              <div className="text-center py-12 text-zinc-500">
                No hay registros para mostrar en este período.
              </div>
            )}
          </div>
        </div>
      </div>

      {showGastoModal && (
        <ModalNuevoGasto
          isOpen={showGastoModal}
          onClose={() => setShowGastoModal(false)}
          onGuardar={handleGuardarGasto}
          guardando={guardando}
        />
      )}
    </div>
  );
}

function ModalNuevoGasto({ isOpen, onClose, onGuardar, guardando = false }) {
  const [asunto, setAsunto] = useState('');
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState('Efectivo');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!asunto.trim() || !monto) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }
    await onGuardar({ asunto: asunto.trim(), monto: parseFloat(monto), metodo });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">Registrar Gasto</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Asunto / Descripción</label>
            <input
              type="text"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600 border border-zinc-700"
              placeholder="Ej: Pago de alquiler, Insumos, etc."
              autoFocus
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Monto ($)</label>
              <input
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600 border border-zinc-700"
                placeholder="0"
                min="1"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Forma de Pago</label>
              <select
                value={metodo}
                onChange={(e) => setMetodo(e.target.value)}
                className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600 border border-zinc-700"
              >
                <option value="Efectivo">Efectivo (Caja)</option>
                <option value="Virtual">Virtual (Transferencia)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={guardando}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors rounded-lg py-4 font-medium mt-4"
          >
            {guardando ? 'Guardando...' : 'Guardar Movimiento'}
          </button>
        </form>
      </div>
    </div>
  );
}