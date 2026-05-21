import { calcTotalesCobro } from '../lib/cobro.js';

export function TicketCobro({
  items = [],
  descuento = 0,
  pagos = [],
  metodosPago = [],
  tipo = 'mostrador',
  numeroMesa,
  codigo,
  fecha = new Date(),
  vuelto = 0,
  efectivoRecibido,
}) {
  const subtotal = items.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
  const { baseACobrar, totalRecargo, totalACobrar, pagosDetalle } = calcTotalesCobro({
    totalVenta: subtotal,
    descuento,
    pagos,
    metodosPago,
  });

  const titulo = tipo === 'mesa' ? `Mesa ${numeroMesa}` : 'Mostrador';

  return (
    <div className="ticket-cobro font-mono text-black bg-white p-6 max-w-sm mx-auto text-sm">
      <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
        <p className="font-bold text-lg">CLUB 22</p>
        <p className="text-xs text-gray-600">{titulo}</p>
        {codigo && <p className="text-xs mt-1">#{codigo}</p>}
        <p className="text-xs text-gray-500 mt-1">
          {fecha.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })}
        </p>
      </div>

      <div className="space-y-1 mb-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between gap-2">
            <span>
              {item.cantidad}x {item.nombreProducto || item.nombre}
            </span>
            <span>${(item.precio * item.cantidad).toLocaleString()}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-gray-400 pt-2 space-y-1">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>${subtotal.toLocaleString()}</span>
        </div>
        {descuento > 0 && (
          <div className="flex justify-between text-green-700">
            <span>Descuento</span>
            <span>-${descuento.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between font-medium">
          <span>Importe</span>
          <span>${baseACobrar.toLocaleString()}</span>
        </div>
        {pagosDetalle.map((p, idx) =>
          p.recargoMonto !== 0 ? (
            <div key={idx} className="flex justify-between text-red-700">
              <span>
                Recargo {p.metodo} ({p.recargoPct > 0 ? '+' : ''}
                {p.recargoPct}%)
              </span>
              <span>
                {p.recargoMonto > 0 ? '+' : ''}${Math.abs(p.recargoMonto).toLocaleString()}
              </span>
            </div>
          ) : null
        )}
        {totalRecargo !== 0 && pagosDetalle.length > 1 && (
          <div className="flex justify-between text-red-700">
            <span>Total recargos</span>
            <span>+${totalRecargo.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-400 mt-2">
          <span>TOTAL</span>
          <span>${totalACobrar.toLocaleString()}</span>
        </div>
        {efectivoRecibido != null && efectivoRecibido > 0 && (
          <>
            <div className="flex justify-between mt-2">
              <span>Efectivo recibido</span>
              <span>${efectivoRecibido.toLocaleString()}</span>
            </div>
            {vuelto > 0 && (
              <div className="flex justify-between font-bold">
                <span>Vuelto</span>
                <span>${vuelto.toLocaleString()}</span>
              </div>
            )}
          </>
        )}
      </div>

      {pagosDetalle.length > 0 && (
        <div className="border-t border-dashed border-gray-400 mt-3 pt-2 space-y-1 text-xs">
          <p className="font-bold mb-1">Forma de pago</p>
          {pagosDetalle.map((p, idx) => (
            <div key={idx}>
              <span>{p.metodo}: </span>
              <span>
                ${(efectivoRecibido != null && idx === 0 ? totalACobrar : p.monto).toLocaleString()}
              </span>
              {p.recargoMonto !== 0 && (
                <span className="text-red-700">
                  {' '}
                  + recargo ${Math.abs(p.recargoMonto).toLocaleString()}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-gray-500 mt-4">¡Gracias por su compra!</p>
    </div>
  );
}

export function imprimirTicket(element) {
  if (!element) return;
  const ventana = window.open('', '_blank', 'width=400,height=600');
  if (!ventana) {
    alert('Permití ventanas emergentes para imprimir el ticket');
    return;
  }
  ventana.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Ticket</title>
        <style>
          body { margin: 0; padding: 16px; font-family: monospace; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>${element.innerHTML}</body>
    </html>
  `);
  ventana.document.close();
  ventana.focus();
  ventana.print();
  ventana.close();
}
