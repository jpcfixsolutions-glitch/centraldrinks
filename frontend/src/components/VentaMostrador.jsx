import { useState, useRef, useMemo } from 'react';
import { ArrowLeft, Plus, Printer, DollarSign, Trash2, Minus, Receipt } from 'lucide-react';
import { AgregarProductoModal } from './AgregarProductoModal.jsx';
import { CobroDivididoModal } from './CobroDivididoModal.jsx';
import { TicketCobro, imprimirTicket } from './TicketCobro.jsx';
import { ConfirmarImprimirTicketModal } from './ConfirmarImprimirTicketModal.jsx';
import { BotonImprimirVenta } from './BotonImprimirVenta.jsx';
import { useImprimirVentaTicket } from '../hooks/useImprimirVentaTicket.jsx';
import { validarCantidadStock, validarCarritoStock, stockDisponible } from '../lib/stock.js';
import { formatearFechaCorta } from '../lib/fechas.js';

export function VentaMostrador({ onVolver, metodosPago, productos, ventas, onRegistrarVenta }) {
  const [carrito, setCarrito] = useState([]);
  const [showAgregarModal, setShowAgregarModal] = useState(false);
  const [showCobrarModal, setShowCobrarModal] = useState(false);
  const [ventaRecienRegistrada, setVentaRecienRegistrada] = useState(null);
  const ticketPreCobroRef = useRef(null);
  const { imprimirVenta, TicketOculto } = useImprimirVentaTicket(metodosPago);

  const totalVenta = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  const cantidadesCarrito = useMemo(() => {
    const totales = {};
    for (const item of carrito) {
      totales[item.id] = (totales[item.id] ?? 0) + item.cantidad;
    }
    return totales;
  }, [carrito]);

  const lineKey = (item) => `${item.id}-${item.tipoPrecio ?? 'mostrador'}`;

  const cantidadTotalProducto = (productoId) => cantidadesCarrito[productoId] ?? 0;

  const agregarProducto = (producto) => {
    const productoActual = productos.find((p) => p.id === producto.id);
    const tipoPrecio = producto.tipoPrecio ?? 'mostrador';
    const validacion = validarCantidadStock(
      productoActual,
      cantidadTotalProducto(producto.id) + 1
    );
    if (!validacion.ok) {
      alert(validacion.mensaje);
      return;
    }

    setCarrito((prev) => {
      const key = `${producto.id}-${tipoPrecio}`;
      const existente = prev.find((p) => lineKey(p) === key);
      if (existente) {
        return prev.map((p) => (lineKey(p) === key ? { ...p, cantidad: p.cantidad + 1 } : p));
      }
      return [...prev, { ...producto, tipoPrecio, cantidad: 1 }];
    });
  };

  const aumentarCantidad = (key) => {
    const itemCarrito = carrito.find((p) => lineKey(p) === key);
    if (!itemCarrito) return;

    const productoActual = productos.find((p) => p.id === itemCarrito.id);
    const validacion = validarCantidadStock(
      productoActual,
      cantidadTotalProducto(itemCarrito.id) + 1
    );
    if (!validacion.ok) {
      alert(validacion.mensaje);
      return;
    }

    setCarrito((prev) =>
      prev.map((p) => (lineKey(p) === key ? { ...p, cantidad: p.cantidad + 1 } : p))
    );
  };

  const disminuirCantidad = (key) => {
    setCarrito((prev) => {
      const producto = prev.find((p) => lineKey(p) === key);
      if (producto && producto.cantidad > 1) {
        return prev.map((p) => (lineKey(p) === key ? { ...p, cantidad: p.cantidad - 1 } : p));
      }
      return prev.filter((p) => lineKey(p) !== key);
    });
  };

  const eliminarProducto = (key) => {
    setCarrito((prev) => prev.filter((p) => lineKey(p) !== key));
  };

  const handleConfirmarVenta = async ({ descuento, pagos, metodoPagoPrincipal, totalACobrar }) => {
    const validacionCarrito = validarCarritoStock(productos, carrito);
    if (!validacionCarrito.ok) {
      alert(validacionCarrito.mensaje);
      return;
    }

    const venta = {
      tipo: 'mostrador',
      total: totalACobrar,
      descuento,
      metodoPago: metodoPagoPrincipal || 'Efectivo',
      items: carrito.map((p) => ({
        productoId: p.id,
        nombreProducto: p.nombre,
        precio: p.precio,
        cantidad: p.cantidad,
      })),
      pagos,
    };
    const creada = await onRegistrarVenta(venta);
    setCarrito([]);
    setShowCobrarModal(false);
    setVentaRecienRegistrada({
      venta: {
        ...venta,
        codigo: creada?.codigo,
        fecha: creada?.fecha ?? new Date().toISOString(),
        pagos: pagos.map((p) => ({ metodoPago: p.metodoPago, monto: p.monto, recargo: p.recargo })),
      },
      codigo: creada?.codigo,
      total: totalACobrar,
    });
  };

  const handleImprimirPreCobro = () => {
    imprimirTicket(ticketPreCobroRef.current);
  };

  return (
    <>
      <div className="flex-1 flex flex-col bg-black text-white">
        <header className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 border-b border-zinc-800 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button onClick={onVolver} className="hover:bg-zinc-800 p-2 rounded-lg transition-colors shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold truncate">Venta Mostrador</h1>
          </div>
          <button
            onClick={() => setShowAgregarModal(true)}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 transition-colors px-4 sm:px-6 py-3 rounded-lg flex items-center justify-center gap-2 shrink-0"
          >
            <Plus className="w-5 h-5" />
            Buscar Producto
          </button>
        </header>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-zinc-900 rounded-lg border border-zinc-800 p-6">
              {carrito.length === 0 ? (
                <div className="h-full flex items-center justify-center text-zinc-500">Carrito vacío</div>
              ) : (
                <div className="space-y-3">
                  {carrito.map((producto) => {
                    const productoActual = productos.find((p) => p.id === producto.id);
                    const key = lineKey(producto);
                    const alMaximoStock =
                      cantidadTotalProducto(producto.id) >=
                      (productoActual ? stockDisponible(productoActual) : 0);

                    return (
                    <div key={key} className="bg-zinc-800 rounded-lg p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{producto.nombre}</p>
                        <p className="text-sm text-zinc-400">
                          {producto.categoria}
                          <span className="ml-2 text-xs uppercase tracking-wide text-zinc-500">
                            · {producto.tipoPrecio === 'mesa' ? 'Precio mesa' : 'Precio mostrador'}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto">
                        <div className="flex items-center gap-2 bg-zinc-700 rounded-lg shrink-0">
                          <button
                            onClick={() => disminuirCantidad(key)}
                            className="p-2 hover:bg-zinc-600 rounded-l-lg transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-3 min-w-[2rem] text-center">{producto.cantidad}</span>
                          <button
                            onClick={() => aumentarCantidad(key)}
                            disabled={alMaximoStock}
                            className="p-2 hover:bg-zinc-600 rounded-r-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-red-500 font-medium w-24 text-right">
                          ${(producto.precio * producto.cantidad).toLocaleString()}
                        </p>
                        <button
                          onClick={() => eliminarProducto(key)}
                          className="p-2 hover:bg-red-600/20 rounded-lg transition-colors text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
                <p className="text-zinc-400 text-sm mb-2">Total Venta</p>
                <p className="text-3xl sm:text-4xl font-bold text-red-500">${totalVenta.toLocaleString()}</p>
              </div>

              <button
                onClick={handleImprimirPreCobro}
                disabled={carrito.length === 0}
                className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg p-4 flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                Imprimir Ticket
              </button>

              <button
                onClick={() => setShowCobrarModal(true)}
                disabled={carrito.length === 0}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg p-4 flex items-center justify-center gap-2"
              >
                <DollarSign className="w-5 h-5" />
                Cobrar
              </button>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-lg border border-zinc-800">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-zinc-400" />
                <h3 className="font-bold uppercase tracking-wide">Movimientos de la caja actual</h3>
              </div>
              <span className="text-sm text-zinc-500">{ventas.length} items</span>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {ventas.length === 0 ? (
                <div className="p-8 text-center text-zinc-500">No hay ventas de mostrador en la caja actual</div>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {ventas.map((venta) => (
                    <div key={venta.id} className="p-4 hover:bg-zinc-800/50 transition-colors">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-zinc-500 uppercase mb-1">
                            {venta.metodoPago} · #{venta.codigo}
                          </p>
                          <p className="text-xs text-zinc-400">
                            {formatearFechaCorta(venta.fecha)} hs
                          </p>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2 sm:text-right shrink-0">
                          {venta.pagos?.some((p) => p.recargo > 0) && (
                            <p className="text-xs text-zinc-500">
                              Importe ${(venta.total - venta.pagos.reduce((s, p) => s + p.recargo, 0)).toLocaleString()}
                              {' '}+ recargo ${venta.pagos.reduce((s, p) => s + p.recargo, 0).toLocaleString()}
                            </p>
                          )}
                          <p className="text-lg font-bold">${venta.total.toLocaleString()}</p>
                          <BotonImprimirVenta onClick={() => imprimirVenta(venta)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AgregarProductoModal
        isOpen={showAgregarModal}
        onClose={() => setShowAgregarModal(false)}
        onAgregar={agregarProducto}
        productos={productos}
        cantidadesCarrito={cantidadesCarrito}
      />

      <CobroDivididoModal
        isOpen={showCobrarModal}
        onClose={() => setShowCobrarModal(false)}
        totalVenta={totalVenta}
        onConfirmar={handleConfirmarVenta}
        metodosPago={metodosPago}
        items={carrito}
        tipo="mostrador"
      />

      <ConfirmarImprimirTicketModal
        isOpen={!!ventaRecienRegistrada}
        onClose={() => setVentaRecienRegistrada(null)}
        onImprimir={() => ventaRecienRegistrada && imprimirVenta(ventaRecienRegistrada.venta)}
        codigo={ventaRecienRegistrada?.codigo}
        total={ventaRecienRegistrada?.total}
      />

      <div className="hidden" aria-hidden="true">
        <div ref={ticketPreCobroRef}>
          <TicketCobro
            items={carrito.map((p) => ({
              nombre: p.nombre,
              precio: p.precio,
              cantidad: p.cantidad,
            }))}
            tipo="mostrador"
          />
        </div>
      </div>

      <TicketOculto />
    </>
  );
}
