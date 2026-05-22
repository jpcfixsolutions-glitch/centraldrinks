import { Printer } from 'lucide-react';

export function BotonImprimirVenta({ onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        className ||
        'p-2 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white'
      }
      title="Imprimir ticket"
    >
      <Printer className="w-4 h-4" />
    </button>
  );
}
