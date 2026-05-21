import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface Pago {
  id: number;
  metodo: string;
  monto: number;
}

interface CobroDivididoModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalVenta: number;
  onConfirmar: (detalles: { pagos: Pago[], descuento: number, totalRecargo: number, totalFinal: number }) => void;
  metodosPago: { id: number; nombre: string; recargo: number }[];
}

export function CobroDivididoModal({ isOpen, onClose, totalVenta, onConfirmar, metodosPago }: CobroDivididoModalProps) {
  const [descuento, setDescuento] = useState(0);
  const [pagos, setPagos] = useState<Pago[]>([]);

  const obtenerBase = (montoFinal: number, metodoNombre: string) => {
    const metodo = metodosPago.find(m => m.nombre === metodoNombre);
    const porcentaje = metodo ? Number(metodo.recargo) : 0;
    return montoFinal / (1 + (porcentaje / 100));
  };

  useEffect(() => {
    if (isOpen) {
      setDescuento(0);
      const metodoInicial = metodosPago[0];
      const porcentaje = metodoInicial ? Number(metodoInicial.recargo) : 0;
      const montoFinal = totalVenta * (1 + (porcentaje / 100));
      setPagos([{ id: 1, metodo: metodoInicial?.nombre || '', monto: Number(montoFinal.toFixed(2)) }]);
    }
  }, [isOpen, metodosPago, totalVenta]);

  const totalBaseCubierto = pagos.reduce((sum, pago) => sum + obtenerBase(pago.monto || 0, pago.metodo), 0);

  const totalACobrarBase = totalVenta - descuento;
  const diferenciaBase = totalBaseCubierto - totalACobrarBase;
  
  const montoCubierto = Math.abs(diferenciaBase) < 0.01;
  const sobrante = diferenciaBase > 0.01;
  const faltante = diferenciaBase < -0.01;
  
  const totalFinalCliente = pagos.reduce((sum, pago) => sum + (pago.monto || 0), 0);
  const totalRecargo = pagos.reduce((sum, pago) => {
    const base = obtenerBase(pago.monto || 0, pago.metodo);
    return sum + ((pago.monto || 0) - base);
  }, 0);

  if (!isOpen) return null;

  const agregarMetodoPago = () => {
    if (pagos.length >= 2) return;
    const nuevoId = Math.max(...pagos.map(p => p.id), 0) + 1;
    const metodoDisponible = metodosPago.find(m => !pagos.some(p => p.metodo === m.nombre)) || metodosPago[0];
    const recargoNuevo = metodoDisponible ? Number(metodoDisponible.recargo) : 0;
    const baseSugerida = faltante ? Math.abs(diferenciaBase) : 0;
    const montoSugeridoFinal = baseSugerida * (1 + (recargoNuevo / 100));
    setPagos([...pagos, { id: nuevoId, metodo: metodoDisponible?.nombre || '', monto: Number(montoSugeridoFinal.toFixed(2)) }]);
  };

  const eliminarMetodoPago = (id: number) => {
    if (pagos.length === 1) return;
    setPagos(pagos.filter(p => p.id !== id));
  };

  const actualizarMonto = (id: number, montoStr: string) => {
    const monto = parseFloat(montoStr) || 0;
    setPagos(pagos.map(p => p.id === id ? { ...p, monto } : p));
  };

  const actualizarMetodo = (id: number, metodo: string) => {
    setPagos(pagos.map(p => {
      if (p.id === id) {
        const baseActual = obtenerBase(p.monto || 0, p.metodo);
        const metodoNuevo = metodosPago.find(m => m.nombre === metodo);
        const recargoNuevo = metodoNuevo ? Number(metodoNuevo.recargo) : 0;
        const nuevoMontoFinal = baseActual * (1 + (recargoNuevo / 100));
        return { ...p, metodo, monto: Number(nuevoMontoFinal.toFixed(2)) };
      }
      return p;
    }));
  };

  const handleConfirmar = () => {
    if (!montoCubierto) return;
    onConfirmar({ pagos, descuento, totalRecargo, totalFinal: totalFinalCliente });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold">Cobro Dividido</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Descuento */}
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

          {/* Pagos */}
          <div className="space-y-4">
            <label className="block text-sm text-zinc-400">PAGO PRINCIPAL</label>

            {pagos.map((pago, index) => (
              <div
                key={pago.id}
                className={`space-y-2 ${index > 0 ? 'pt-4 border-t border-red-900' : ''}`}
              >
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
                    {metodosPago.map(metodo => (
                      <option key={metodo.id} value={metodo.nombre}>
                        {metodo.nombre} {Number(metodo.recargo) !== 0 && `(${Number(metodo.recargo) > 0 ? '+' : ''}${metodo.recargo}%)`}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={pago.monto || ''}
                    onChange={(e) => actualizarMonto(pago.id, e.target.value)}
                    placeholder="0"
                    className="bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
              </div>
            ))}

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

          {/* Total */}
          <div className="bg-zinc-800 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Subtotal:</span>
              <span className="text-zinc-300">${totalVenta.toLocaleString()}</span>
            </div>
            {descuento > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Descuento:</span>
                <span className="text-green-500">-${descuento.toLocaleString()}</span>
              </div>
            )}
            {pagos.some(p => {
              const metodo = metodosPago.find(m => m.nombre === p.metodo);
              return metodo && Number(metodo.recargo) !== 0 && (p.monto || 0) > 0;
            }) && (
              <div className="border-t border-zinc-700 pt-2 space-y-1">
                {pagos.map(pago => {
                  const metodo = metodosPago.find(m => m.nombre === pago.metodo);
                  const base = obtenerBase(pago.monto || 0, pago.metodo);
                  const recargo = (pago.monto || 0) - base;
                  if (Math.abs(recargo) < 0.01 || (pago.monto || 0) === 0) return null;
                  return (
                    <div key={pago.id} className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Recargo {pago.metodo}:</span>
                      <span className={recargo > 0 ? 'text-red-500' : 'text-green-500'}>
                        {recargo > 0 ? '+' : ''}${Number(recargo.toFixed(2)).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex items-start justify-between pt-2 border-t border-zinc-700">
              <div>
                <p className="text-lg font-medium">A COBRAR:</p>
                {faltante && (
                  <p className="text-sm text-yellow-500">
                    Pendiente Base: ${Math.abs(diferenciaBase).toLocaleString()}
                  </p>
                )}
                {sobrante && (
                  <p className="text-sm text-yellow-500">
                    Sobrante Base: ${Math.abs(diferenciaBase).toLocaleString()}
                  </p>
                )}
                {montoCubierto && (
                  <p className="text-sm text-green-500">
                    ✓ Base cubierta
                  </p>
                )}
              </div>
              <p className="text-2xl font-bold">${totalFinalCliente.toLocaleString()}</p>
            </div>
          </div>

          {/* Confirmar */}
          <button
            onClick={handleConfirmar}
            disabled={!montoCubierto}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg py-4 font-medium"
          >
            Confirmar y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
