import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Printer, Trash2, Minus, XCircle } from 'lucide-react';
import { AgregarProductoMesaModal } from './AgregarProductoMesaModal';
import { CobroDivididoModal } from './CobroDivididoModal';

interface ProductoCarrito {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  categoria: string;
}

interface EstadoMesa {
  numeroMesa: number;
  productos: ProductoCarrito[];
  totalAcumulado: number;
}

interface CierreCaja {
  id: string;
  hora: string;
  metodoPago: string;
  total: number;
  tipo: 'mostrador' | 'mesa';
  numeroMesa?: number;
  productos: { nombre: string; cantidad: number; precio: number }[];
}

interface VentaMesaProps {
  numeroMesa: number;
  onVolver: () => void;
  onCerrarMesa: (numeroMesa: number, total: number, ventaCaja: CierreCaja) => void;
  metodosPago: { id: number; nombre: string; recargo: number }[];
  estadoMesa: EstadoMesa | null;
  onActualizarEstado: (numeroMesa: number, productos: ProductoCarrito[], totalAcumulado: number) => void;
}

export function VentaMesa({ numeroMesa, onVolver, onCerrarMesa, metodosPago, estadoMesa, onActualizarEstado }: VentaMesaProps) {
  const [carrito, setCarrito] = useState<ProductoCarrito[]>([]);
  const [showAgregarModal, setShowAgregarModal] = useState(false);
  const [showCerrarMesaModal, setShowCerrarMesaModal] = useState(false);

  // Cargar estado de la mesa al montar
  useEffect(() => {
    if (estadoMesa) {
      setCarrito(estadoMesa.productos);
    }
  }, [estadoMesa]);

  // Actualizar estado cada vez que cambia el carrito
  useEffect(() => {
    if (carrito.length > 0) {
      onActualizarEstado(numeroMesa, carrito, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carrito, numeroMesa]);

  const totalMesa = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

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

  const handleCerrarMesa = () => {
    if (carrito.length === 0) {
      alert('No hay productos para cobrar');
      return;
    }
    setShowCerrarMesaModal(true);
  };

  const handleConfirmarCerrarMesa = () => {
    // Crear registro de venta para la caja
    const ventaCaja: CierreCaja = {
      id: `MESA${numeroMesa}_${Date.now()}`,
      hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      metodoPago: 'Efectivo', // Se actualizará desde el modal de cobro
      total: totalMesa,
      tipo: 'mesa',
      numeroMesa: numeroMesa,
      productos: carrito.map(p => ({
        nombre: p.nombre,
        cantidad: p.cantidad,
        precio: p.precio
      }))
    };

    onCerrarMesa(numeroMesa, totalMesa, ventaCaja);
    setShowCerrarMesaModal(false);
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

        {/* Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-8">
          {/* Carrito */}
          <div className="lg:col-span-2 bg-zinc-900 rounded-lg border border-zinc-800 p-6">
            {carrito.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-500">
                Mesa vacía
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
            {/* Total Mesa */}
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

      {/* Modales */}
      <AgregarProductoMesaModal
        isOpen={showAgregarModal}
        onClose={() => setShowAgregarModal(false)}
        onAgregar={agregarProducto}
      />

      {/* Modal Confirmar Cerrar Mesa con Cobro */}
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
