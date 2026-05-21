import { useState } from 'react';
import { X, Wallet } from 'lucide-react';

export function AbrirCajaModal({ isOpen, onClose, onConfirmar }) {
  const [efectivoInicial, setEfectivoInicial] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const monto = parseFloat(efectivoInicial);
    if (isNaN(monto) || monto < 0) {
      setErrorMsg('Ingresá un monto válido (0 o más)');
      return;
    }
    setErrorMsg(null);
    setProcesando(true);
    try {
      await onConfirmar(monto);
      setEfectivoInicial('');
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error al abrir la caja');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-lg w-full max-w-md border border-zinc-800">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-white">Abrir Caja</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <p className="text-sm text-zinc-400">
            Ingresá el efectivo inicial en caja para dar cambio. Este monto se usará al cerrar el día para
            verificar que todo coincida.
          </p>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Efectivo inicial ($)</label>
            <input
              type="number"
              value={efectivoInicial}
              onChange={(e) => setEfectivoInicial(e.target.value)}
              placeholder="Ej: 50000"
              min="0"
              step="100"
              autoFocus
              className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:ring-2 focus:ring-green-600 border border-zinc-700"
            />
          </div>

          {errorMsg && (
            <div className="bg-red-900/40 border border-red-700 text-red-200 rounded-lg px-4 py-3 text-sm">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={procesando}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors rounded-lg py-4 font-bold text-white"
          >
            {procesando ? 'Abriendo...' : 'Confirmar Apertura'}
          </button>
        </form>
      </div>
    </div>
  );
}
