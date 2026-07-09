import { ShieldX } from 'lucide-react';

export function ModalSuscripcionExpirada({ onLogout }) {
  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-red-800/60 rounded-2xl w-full max-w-md shadow-2xl shadow-red-900/30 p-8 flex flex-col items-center text-center gap-5">
        <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center">
          <ShieldX className="w-8 h-8 text-red-500" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Suscripción Expirada</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            El período de suscripción del servicio ha finalizado.
            Para restablecer el acceso, comunicate con los desarrolladores.
          </p>
        </div>

        <div className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg p-4 text-sm text-zinc-400 space-y-1">
          <p className="font-medium text-zinc-300">¿Necesitás ayuda?</p>
          <p>Contactá a los desarrolladores para renovar tu suscripción y recuperar el acceso.</p>
        </div>

        <button
          onClick={onLogout}
          className="w-full bg-red-600 hover:bg-red-700 transition-colors rounded-lg py-3 font-bold text-white"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
