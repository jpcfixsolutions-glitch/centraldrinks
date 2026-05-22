import { useState } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';

export function ConfirmarEliminacionModal({
  isOpen,
  onClose,
  onConfirmar,
  titulo = 'Confirmar eliminación',
  mensaje = '¿Estás seguro de que deseás eliminar este elemento?',
  nombreEntidad,
}) {
  const [procesando, setProcesando] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleConfirmar = async () => {
    setErrorMsg(null);
    setProcesando(true);
    try {
      await onConfirmar();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error al eliminar');
    } finally {
      setProcesando(false);
    }
  };

  const handleClose = () => {
    if (procesando) return;
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl w-full max-w-md border border-zinc-800 shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{titulo}</h2>
              <p className="text-sm text-zinc-500">Esta acción no se puede deshacer</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={procesando}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-zinc-300">{mensaje}</p>

          {nombreEntidad && (
            <div className="bg-zinc-800/60 rounded-lg px-4 py-3 border border-zinc-700/50">
              <p className="text-sm text-zinc-500 mb-1">Elemento a eliminar</p>
              <p className="font-semibold text-white">{nombreEntidad}</p>
            </div>
          )}

          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-200/90">
              Una vez eliminado, no podrás recuperarlo. Verificá que sea el elemento correcto.
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-900/40 border border-red-700 text-red-200 rounded-lg px-4 py-3 text-sm">
              {errorMsg}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t border-zinc-800">
          <button
            type="button"
            onClick={handleClose}
            disabled={procesando}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 transition-colors rounded-lg py-3 font-medium text-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={procesando}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors rounded-lg py-3 font-bold text-white"
          >
            {procesando ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}
