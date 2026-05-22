import { useState, useRef, useEffect, useMemo } from 'react';
import { ArrowLeft, Plus, Printer, DollarSign, Trash2, Minus, Receipt } from 'lucide-react';
import { AgregarProductoModal } from './AgregarProductoModal.jsx';
import { CobroDivididoModal } from './CobroDivididoModal.jsx';
import { TicketCobro, imprimirTicket } from './TicketCobro.jsx';
import { validarCantidadStock, validarCarritoStock, stockDisponible } from '../lib/stock.js';

export function VentaMostrador({ onVolver, metodosPago, productos, ventas, onRegistrarVenta }) {
  const [carrito, setCarrito] = useState([]);
  const [showAgregarModal, setShowAgregarModal] = useState(false);
  const [showCobrarModal, setShowCobrarModal] = useState(false);
  const [ticketPostVenta, setTicketPostVenta] = useState(null);
  const ticketPreCobroRef = useRef(null);
  const ticketPostVentaRef = useRef(null);

  useEffect(() => {
    if (ticketPostVenta && ticketPostVentaRef.current) {
      imprimirTicket(ticketPostVentaRef.current);
      setTicketPostVenta(null);
    }
  }, [ticketPostVenta]);

  const totalVenta = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  const cantidadesCarrito = useMemo(
    () => Object.fromEntries(carrito.map((item) => [item.id, item.cantidad])),
    [carrito]
  );

  const agregarProducto = (producto) => {
    const productoActual = productos.find((p) => p.id === producto.id);
    const cantidadEnCarrito = cantidadesCarrito[producto.id] ?? 0;
    const validacion = validarCantidadStock(productoActual, cantidadEnCarrito + 1);
    if (!validacion.ok) {
      alert(validacion.mensaje);
      return;
    }

    setCarrito((prev) => {
      const existente = prev.find((p) => p.id === producto.id);
      if (existente) {
        return prev.map((p) => (p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p));
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const aumentarCantidad = (id) => {
    const productoActual = productos.find((p) => p.id === id);
    const itemCarrito = carrito.find((p) => p.id === id);
    const validacion = validarCantidadStock(productoActual, (itemCarrito?.cantidad ?? 0) + 1);
    if (!validacion.ok) {
      alert(validacion.mensaje);
      return;
    }

    setCarrito((prev) => prev.map((p) => (p.id === id ? { ...p, cantidad: p.cantidad + 1 } : p)));
  };

  const disminuirCantidad = (id) => {
    setCarrito((prev) => {
      const producto = prev.find((p) => p.id === id);
      if (producto && producto.cantidad > 1) {
        return prev.map((p) => (p.id === id ? { ...p, cantidad: p.cantidad - 1 } : p));
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  const eliminarProducto = (id) => {
    setCarrito((prev) => prev.filter((p) => p.id !== id));
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
    setTicketPostVenta({
      items: venta.items,
      descuento,
      pagos: pagos.map((p) => ({ metodo: p.metodoPago, monto: p.monto })),
      codigo: creada?.codigo,
    });
  };

  const handleImprimirPreCobro = () => {
    imprimirTicket(ticketPreCobroRef.current);
  };

  return (
    <>
      <div className="flex-1 flex flex-col bg-black text-white">
        <header className="px-8 py-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onVolver} className="hover:bg-zinc-800 p-2 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">Venta Mostrador</h1>
          </div>
          <button
            onClick={() => setShowAgregarModal(true)}
            className="bg-red-600 hover:bg-red-700 transition-colors px-6 py-3 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Buscar Producto
          </button>
        </header>

        <div className="flex-1 p-8 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-zinc-900 rounded-lg border border-zinc-800 p-6">
              {carrito.length === 0 ? (
                <div className="h-full flex items-center justify-center text-zinc-500">Carrito vacío</div>
              ) : (
                <div className="space-y-3">
                  {carrito.map((producto) => {
                    const productoActual = productos.find((p) => p.id === producto.id);
                    const alMaximoStock =
                      (productoActual ? stockDisponible(productoActual) : 0) <= producto.cantidad;

                    return (
                    <div key={producto.id} className="bg-zinc-800 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{producto.nombre}</p>
                        <p className="text-sm text-zinc-400">{producto.categoria}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-zinc-700 rounded-lg">
                          <button
                            onClick={() => disminuirCantidad(producto.id)}
                            className="p-2 hover:bg-zinc-600 rounded-l-lg transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-3 min-w-[2rem] text-center">{producto.cantidad}</span>
                          <button
                            onClick={() => aumentarCantidad(producto.id)}
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
                          onClick={() => eliminarProducto(producto.id)}
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
                <p className="text-4xl font-bold text-red-500">${totalVenta.toLocaleString()}</p>
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
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-xs text-zinc-500 uppercase mb-1">
                            {venta.metodoPago} · #{venta.codigo}
                          </p>
                          <p className="text-xs text-zinc-400">
                            {new Date(venta.fecha).toLocaleString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit',
                              hour12: false,
                            })}{' '}
                            hs
                          </p>
                        </div>
                        <div className="text-right">
                          {venta.pagos?.some((p) => p.recargo > 0) && (
                            <p className="text-xs text-zinc-500">
                              Importe ${(venta.total - venta.pagos.reduce((s, p) => s + p.recargo, 0)).toLocaleString()}
                              {' '}+ recargo ${venta.pagos.reduce((s, p) => s + p.recargo, 0).toLocaleString()}
                            </p>
                          )}
                          <p className="text-lg font-bold">${venta.total.toLocaleString()}</p>
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
        {ticketPostVenta && (
          <div ref={ticketPostVentaRef}>
            <TicketCobro
              items={ticketPostVenta.items}
              descuento={ticketPostVenta.descuento}
              pagos={ticketPostVenta.pagos}
              metodosPago={metodosPago}
              tipo="mostrador"
              codigo={ticketPostVenta.codigo}
            />
          </div>
        )}
      </div>
    </>
  );
}
