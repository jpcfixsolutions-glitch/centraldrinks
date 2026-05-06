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
  onConfirmar: () => void;
  metodosPago: { id: number; nombre: string; recargo: number }[];
}

export function CobroDivididoModal({ isOpen, onClose, totalVenta, onConfirmar, metodosPago }: CobroDivididoModalProps) {
  const [descuento, setDescuento] = useState(0);
  const [pagos, setPagos] = useState<Pago[]>([
    { id: 1, metodo: metodosPago[0]?.nombre || '', monto: 0 }
  ]);

  // Calcular total con recargos
  const totalPagosConRecargo = pagos.reduce((sum, pago) => {
    const metodo = metodosPago.find(m => m.nombre === pago.metodo);
    const recargo = metodo ? (pago.monto * metodo.recargo / 100) : 0;
    return sum + pago.monto + recargo;
  }, 0);

  const totalACobrar = totalVenta - descuento;
  const diferencia = totalPagosConRecargo - totalACobrar;
  const montoCubierto = diferencia === 0;
  const sobrante = diferencia > 0;
  const faltante = diferencia < 0;

  useEffect(() => {
    if (isOpen) {
      setDescuento(0);
      setPagos([{ id: 1, metodo: metodosPago[0]?.nombre || '', monto: 0 }]);
    }
  }, [isOpen, metodosPago]);

  if (!isOpen) return null;

  const agregarMetodoPago = () => {
    if (pagos.length >= 2) return;
    const nuevoId = Math.max(...pagos.map(p => p.id)) + 1;
    const metodoDisponible = metodosPago.find(m => !pagos.some(p => p.metodo === m.nombre));
    setPagos([...pagos, { id: nuevoId, metodo: metodoDisponible?.nombre || metodosPago[0]?.nombre || '', monto: 0 }]);
  };

  const eliminarMetodoPago = (id: number) => {
    if (pagos.length === 1) return;
    setPagos(pagos.filter(p => p.id !== id));
  };

  const actualizarMonto = (id: number, monto: string) => {
    const montoNumero = parseFloat(monto) || 0;
    setPagos(pagos.map(p => p.id === id ? { ...p, monto: montoNumero } : p));
  };

  const actualizarMetodo = (id: number, metodo: string) => {
    setPagos(pagos.map(p => p.id === id ? { ...p, metodo } : p));
  };

  const handleConfirmar = () => {
    if (!montoCubierto) return;
    onConfirmar();
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
                        {metodo.nombre} {metodo.recargo !== 0 && `(${metodo.recargo > 0 ? '+' : ''}${metodo.recargo}%)`}
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
              return metodo && metodo.recargo !== 0 && p.monto > 0;
            }) && (
              <div className="border-t border-zinc-700 pt-2 space-y-1">
                {pagos.map(pago => {
                  const metodo = metodosPago.find(m => m.nombre === pago.metodo);
                  const recargo = metodo ? (pago.monto * metodo.recargo / 100) : 0;
                  if (recargo === 0 || pago.monto === 0) return null;
                  return (
                    <div key={pago.id} className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Recargo {pago.metodo}:</span>
                      <span className={recargo > 0 ? 'text-red-500' : 'text-green-500'}>
                        {recargo > 0 ? '+' : ''}${recargo.toLocaleString()}
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
                    Pendiente: ${Math.abs(diferencia).toLocaleString()}
                  </p>
                )}
                {sobrante && (
                  <p className="text-sm text-yellow-500">
                    Sobrante: ${Math.abs(diferencia).toLocaleString()}
                  </p>
                )}
                {montoCubierto && (
                  <p className="text-sm text-green-500">
                    ✓ Monto cubierto
                  </p>
                )}
              </div>
              <p className="text-2xl font-bold">${totalACobrar.toLocaleString()}</p>
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
