import { Printer, CheckCircle2, X } from 'lucide-react';

export function ConfirmarImprimirTicketModal({
  isOpen,
  onClose,
  onImprimir,
  codigo,
  total,
}) {
  if (!isOpen) return null;

  const handleImprimir = () => {
    onImprimir();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-zinc-900 rounded-xl w-full max-w-md border border-zinc-800 shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Venta registrada</h2>
              <p className="text-sm text-zinc-500">El cobro quedó guardado correctamente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-zinc-800/60 rounded-lg px-4 py-3 border border-zinc-700/50 flex items-center justify-between">
            <div>
              {codigo && <p className="text-sm text-zinc-500">Ticket #{codigo}</p>}
              <p className="text-2xl font-bold text-red-500">${total?.toLocaleString()}</p>
            </div>
            <Printer className="w-8 h-8 text-zinc-600" />
          </div>

          <p className="text-zinc-300 text-center">¿Desea imprimir el ticket ahora?</p>
          <p className="text-sm text-zinc-500 text-center">
            Si no imprime ahora, podrá hacerlo más tarde desde el historial de ventas.
          </p>
        </div>

        <div className="flex gap-3 p-6 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 transition-colors rounded-lg py-3 font-medium text-white"
          >
            No, gracias
          </button>
          <button
            type="button"
            onClick={handleImprimir}
            className="flex-1 bg-red-600 hover:bg-red-700 transition-colors rounded-lg py-3 font-bold text-white flex items-center justify-center gap-2"
          >
            <Printer className="w-5 h-5" />
            Sí, imprimir
          </button>
        </div>
      </div>
    </div>
  );
}
