import { useState } from 'react';
import { X, Lock, Wallet, CreditCard, Receipt, AlertTriangle, Utensils } from 'lucide-react';

export function CerrarCajaModal({
  isOpen,
  onClose,
  onConfirmar,
  cantidadVentas = 0,
  totalVentas = 0,
  resumen,
  efectivoInicial = 0,
  mesasPendientes = [],
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
      setErrorMsg(err.message || 'Error al cerrar la caja');
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
      <div className="bg-zinc-900 rounded-xl w-full max-w-lg border border-zinc-800 shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <Lock className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Cerrar Caja</h2>
              <p className="text-sm text-zinc-500">Confirmá el arqueo antes de finalizar el turno</p>
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

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-zinc-800/60 rounded-lg p-4 border border-zinc-700/50">
              <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
                <Receipt className="w-4 h-4" />
                Ventas del turno
              </div>
              <p className="text-2xl font-bold text-white">{cantidadVentas}</p>
              <p className="text-xs text-zinc-500 mt-1">tickets registrados</p>
            </div>
            <div className="bg-zinc-800/60 rounded-lg p-4 border border-zinc-700/50">
              <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
                <Wallet className="w-4 h-4 text-red-500" />
                Total vendido
              </div>
              <p className="text-2xl font-bold text-red-500">${totalVentas.toLocaleString()}</p>
              <p className="text-xs text-zinc-500 mt-1">importe del turno</p>
            </div>
          </div>

          {resumen ? (
            <div className="rounded-lg border border-zinc-700/50 overflow-hidden">
              <div className="px-4 py-3 bg-zinc-800/80 border-b border-zinc-700/50">
                <p className="text-sm font-medium text-zinc-300">Arqueo esperado</p>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-400 text-sm">
                    <Wallet className="w-4 h-4 text-emerald-500" />
                    Efectivo en caja
                  </div>
                  <span className="text-lg font-bold text-emerald-500">
                    ${resumen.efectivoEsperado.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-400 text-sm">
                    <CreditCard className="w-4 h-4 text-blue-500" />
                    Virtual / Transferencias
                  </div>
                  <span className="text-lg font-bold text-blue-500">
                    ${resumen.ingresoVirtual.toLocaleString()}
                  </span>
                </div>
                {(efectivoInicial > 0 || resumen.ingresoEfectivo > 0 || resumen.egresoEfectivo > 0) && (
                  <div className="pt-3 border-t border-zinc-700/50 text-xs text-zinc-500 space-y-1">
                    {efectivoInicial > 0 && <p>Inicial: ${efectivoInicial.toLocaleString()}</p>}
                    {resumen.ingresoEfectivo > 0 && (
                      <p>+ Ventas efectivo: ${resumen.ingresoEfectivo.toLocaleString()}</p>
                    )}
                    {resumen.egresoEfectivo > 0 && (
                      <p>− Gastos efectivo: ${resumen.egresoEfectivo.toLocaleString()}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-zinc-800/60 rounded-lg p-4 border border-zinc-700/50 text-sm text-zinc-400">
              No hay resumen de arqueo disponible. Verificá manualmente antes de cerrar.
            </div>
          )}

          {mesasPendientes.length > 0 && (
            <div className="flex flex-col gap-2 bg-red-500/10 border border-red-500/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
                <Utensils className="w-4 h-4 shrink-0" />
                No se puede cerrar la caja: hay {mesasPendientes.length} mesa{mesasPendientes.length > 1 ? 's' : ''} con consumo pendiente de cobro
              </div>
              <ul className="space-y-1 mt-1 pl-6">
                {mesasPendientes.map((m) => (
                  <li key={m.numeroMesa} className="text-sm text-red-300">
                    Mesa {m.numeroMesa} — {m.cantidadItems} ítem{m.cantidadItems > 1 ? 's' : ''} — ${m.total.toLocaleString()}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-red-400/70 mt-1">
                Cobrá o eliminá los productos de esas mesas antes de cerrar la caja.
              </p>
            </div>
          )}

          {mesasPendientes.length === 0 && (
            <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-200/90">
                Contá el efectivo físico en caja y verificá que coincida con el monto esperado antes de confirmar.
              </p>
            </div>
          )}

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
            disabled={procesando || mesasPendientes.length > 0}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg py-3 font-bold text-white"
          >
            {procesando ? 'Cerrando...' : 'Confirmar Cierre'}
          </button>
        </div>
      </div>
    </div>
  );
}
