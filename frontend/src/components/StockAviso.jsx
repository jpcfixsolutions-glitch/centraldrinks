import { esSinStock, mensajeStockBajo, stockDisponible, stockMinimoDe } from '../lib/stock.js';

export function StockAviso({ producto, className = '' }) {
  const aviso = mensajeStockBajo(producto);
  if (!aviso) return null;

  const esCritico = esSinStock(producto) || stockDisponible(producto) <= stockMinimoDe(producto);
  const color = esCritico ? 'text-red-400' : 'text-amber-400';

  return <p className={`text-xs mt-1 ${color} ${className}`}>{aviso}</p>;
}
