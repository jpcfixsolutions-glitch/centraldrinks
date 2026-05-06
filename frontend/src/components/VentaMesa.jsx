import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Printer, Trash2, Minus, XCircle } from 'lucide-react';
import { AgregarProductoMesaModal } from './AgregarProductoMesaModal.jsx';
import { CobroDivididoModal } from './CobroDivididoModal.jsx';

export function VentaMesa({
  numeroMesa,
  onVolver,
  onConfirmarVenta,
  metodosPago,
  productos,
  cargaInicial,
  onActualizarCarga,
}) {
  const [carrito, setCarrito] = useState(cargaInicial || []);
  const [showAgregarModal, setShowAgregarModal] = useState(false);
  const [showCerrarMesaModal, setShowCerrarMesaModal] = useState(false);

  useEffect(() => {
    onActualizarCarga(numeroMesa, carrito);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carrito, numeroMesa]);

  const totalMesa = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  const agregarProducto = (producto) => {
    setCarrito((prev) => {
      const existente = prev.find((p) => p.id === producto.id);
      if (existente) {
        return prev.map((p) => (p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p));
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const aumentarCantidad = (id) => {
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

  const handleCerrarMesa = () => {
    if (carrito.length === 0) {
      alert('No hay productos para cobrar');
      return;
    }
    setShowCerrarMesaModal(true);
  };

  const handleConfirmarCerrarMesa = async ({ descuento, pagos, metodoPagoPrincipal, totalACobrar }) => {
    const venta = {
      tipo: 'mesa',
      numeroMesa,
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
    await onConfirmarVenta(numeroMesa, venta);
    setShowCerrarMesaModal(false);
  };

  return (
    <>
      <div className="flex-1 flex flex-col bg-black text-white">
        <header className="px-8 py-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onVolver} className="hover:bg-zinc-800 p-2 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">Mesa {numeroMesa}</h1>
          </div>
          <button
            onClick={() => setShowAgregarModal(true)}
            className="bg-red-600 hover:bg-red-700 transition-colors px-6 py-3 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Agregar Item
          </button>
        </header>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-8">
          <div className="lg:col-span-2 bg-zinc-900 rounded-lg border border-zinc-800 p-6">
            {carrito.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-500">Mesa vacía</div>
            ) : (
              <div className="space-y-3">
                {carrito.map((producto) => (
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
                          className="p-2 hover:bg-zinc-600 rounded-r-lg transition-colors"
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
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
              <p className="text-zinc-400 text-sm mb-2">Total Mesa</p>
              <p className="text-4xl font-bold text-red-500">${totalMesa.toLocaleString()}</p>
            </div>

            <button
              disabled={carrito.length === 0}
              className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg p-4 flex items-center justify-center gap-2"
            >
              <Printer className="w-5 h-5" />
              Imprimir Ticket
            </button>

            <button
              onClick={handleCerrarMesa}
              disabled={carrito.length === 0}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg p-4 flex items-center justify-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              Cerrar Mesa / Cobrar
            </button>
          </div>
        </div>
      </div>

      <AgregarProductoMesaModal
        isOpen={showAgregarModal}
        onClose={() => setShowAgregarModal(false)}
        onAgregar={agregarProducto}
        productos={productos}
      />

      {showCerrarMesaModal && (
        <CobroDivididoModal
          isOpen={showCerrarMesaModal}
          onClose={() => setShowCerrarMesaModal(false)}
          totalVenta={totalMesa}
          onConfirmar={handleConfirmarCerrarMesa}
          metodosPago={metodosPago}
        />
      )}
    </>
  );
}
