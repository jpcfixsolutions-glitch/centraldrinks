import { useState } from 'react';
import { ArrowLeft, Plus, Printer, DollarSign, Trash2, Minus, Receipt } from 'lucide-react';
import { AgregarProductoModal } from './AgregarProductoModal';
import { CobroDivididoModal } from './CobroDivididoModal';

interface ProductoCarrito {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  categoria: string;
}

interface VentaMostrador {
  id: string;
  fecha: Date;
  metodoPago: string;
  total: number;
  productos: { nombre: string; cantidad: number; precio: number }[];
}

interface VentaMostradorProps {
  onVolver: () => void;
  metodosPago: { id: number; nombre: string; recargo: number }[];
}

export function VentaMostrador({ onVolver, metodosPago }: VentaMostradorProps) {
  const [carrito, setCarrito] = useState<ProductoCarrito[]>([]);
  const [showAgregarModal, setShowAgregarModal] = useState(false);
  const [showCobrarModal, setShowCobrarModal] = useState(false);
  const [ventasRealizadas, setVentasRealizadas] = useState<VentaMostrador[]>([]);

  const totalVenta = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

  const agregarProducto = (producto: { id: number; nombre: string; precio: number; categoria: string }) => {
    setCarrito(prev => {
      const existente = prev.find(p => p.id === producto.id);
      if (existente) {
        return prev.map(p =>
          p.id === producto.id
            ? { ...p, cantidad: p.cantidad + 1 }
            : p
        );
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const aumentarCantidad = (id: number) => {
    setCarrito(prev => prev.map(p =>
      p.id === id ? { ...p, cantidad: p.cantidad + 1 } : p
    ));
  };

  const disminuirCantidad = (id: number) => {
    setCarrito(prev => {
      const producto = prev.find(p => p.id === id);
      if (producto && producto.cantidad > 1) {
        return prev.map(p =>
          p.id === id ? { ...p, cantidad: p.cantidad - 1 } : p
        );
      }
      return prev.filter(p => p.id !== id);
    });
  };

  const eliminarProducto = (id: number) => {
    setCarrito(prev => prev.filter(p => p.id !== id));
  };

  const handleConfirmarVenta = () => {
    // Registrar la venta
    const nuevaVenta: VentaMostrador = {
      id: `MOST${Date.now()}`,
      fecha: new Date(),
      metodoPago: 'Efectivo', // Esto se debería obtener del modal de cobro
      total: totalVenta,
      productos: carrito.map(p => ({
        nombre: p.nombre,
        cantidad: p.cantidad,
        precio: p.precio
      }))
    };

    setVentasRealizadas(prev => [nuevaVenta, ...prev]);
    setCarrito([]);
    setShowCobrarModal(false);
  };

  return (
    <>
      <div className="flex-1 flex flex-col bg-black text-white">
        {/* Header */}
        <header className="px-8 py-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onVolver}
              className="hover:bg-zinc-800 p-2 rounded-lg transition-colors"
            >
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

        {/* Content */}
        <div className="flex-1 p-8 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Carrito */}
            <div className="lg:col-span-2 bg-zinc-900 rounded-lg border border-zinc-800 p-6">
            {carrito.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-500">
                Carrito vacío
              </div>
            ) : (
              <div className="space-y-3">
                {carrito.map(producto => (
                  <div
                    key={producto.id}
                    className="bg-zinc-800 rounded-lg p-4 flex items-center justify-between"
                  >
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

          {/* Resumen */}
          <div className="space-y-4">
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
              <p className="text-zinc-400 text-sm mb-2">Total Venta</p>
              <p className="text-4xl font-bold text-red-500">${totalVenta.toLocaleString()}</p>
            </div>

            <button
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

        {/* Historial de Ventas */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-zinc-400" />
              <h3 className="font-bold uppercase tracking-wide">Movimientos Nuevos</h3>
            </div>
            <span className="text-sm text-zinc-500">{ventasRealizadas.length} items</span>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {ventasRealizadas.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                No hay ventas registradas aún
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {ventasRealizadas.map(venta => (
                  <div key={venta.id} className="p-4 hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-xs text-zinc-500 uppercase mb-1">{venta.metodoPago}</p>
                        <p className="text-xs text-zinc-400">
                          {venta.fecha.toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })} hs
                        </p>
                        <div className="mt-2 space-y-1">
                          {venta.productos.map((producto, idx) => (
                            <p key={idx} className="text-xs text-zinc-400">
                              {producto.cantidad}x {producto.nombre}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
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

      {/* Modales */}
      <AgregarProductoModal
        isOpen={showAgregarModal}
        onClose={() => setShowAgregarModal(false)}
        onAgregar={agregarProducto}
      />

      <CobroDivididoModal
        isOpen={showCobrarModal}
        onClose={() => setShowCobrarModal(false)}
        totalVenta={totalVenta}
        onConfirmar={handleConfirmarVenta}
        metodosPago={metodosPago}
      />
    </>
  );
}
