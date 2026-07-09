import { AlertTriangle } from 'lucide-react';

export function BannerVencimiento({ diasRestantes, fechaVencimiento }) {
  const fecha = new Date(fechaVencimiento).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="w-full bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 flex items-center gap-3">
      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
      <p className="text-sm text-amber-200/90">
        <strong className="text-amber-300">Aviso:</strong>{' '}
        {diasRestantes === 0
          ? 'La suscripción del servicio vence hoy.'
          : `La suscripción del servicio vencerá en ${diasRestantes} día${diasRestantes > 1 ? 's' : ''} (${fecha}).`}{' '}
        Contactá a los desarrolladores para renovarla.
      </p>
    </div>
  );
}
