import { useState } from 'react';
import { X, Search, Plus, Wine, Package } from 'lucide-react';

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  categoria: string;
  imagen?: string;
}

interface AgregarProductoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgregar: (producto: Producto) => void;
}

const productosDisponibles: Producto[] = [
  { id: 1, nombre: 'Promo Absolut + 2 Speed XL', precio: 30000, categoria: 'Promociones', imagen: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=200&h=200&fit=crop' },
  { id: 2, nombre: 'Promo Absolut + 2 Speed XL', precio: 30000, categoria: 'Promociones', imagen: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=200&h=200&fit=crop' },
  { id: 3, nombre: 'Promo fernet + coca de 2l retornable', precio: 20000, categoria: 'Promociones', imagen: 'https://images.unsplash.com/photo-1629385680481-3c1e1b5d0d5a?w=200&h=200&fit=crop' },
  { id: 4, nombre: 'Promo Skyy + 2 Speed', precio: 15500, categoria: 'Promociones', imagen: 'https://images.unsplash.com/photo-1560512823-829485b8bf24?w=200&h=200&fit=crop' },
  { id: 5, nombre: 'trago', precio: 6000, categoria: 'Vinos', imagen: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=200&h=200&fit=crop' },
  { id: 6, nombre: 'Vino Santa Julia', precio: 11000, categoria: 'Vinos', imagen: 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=200&h=200&fit=crop' },
];

export function AgregarProductoModal({ isOpen, onClose, onAgregar }: AgregarProductoModalProps) {
  const [busqueda, setBusqueda] = useState('');

  if (!isOpen) return null;

  const productosFiltrados = productosDisponibles.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.categoria.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleAgregar = (producto: Producto) => {
    onAgregar(producto);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold">Agregar Producto</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-zinc-800">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o categoría..."
              className="w-full bg-zinc-800 rounded-lg pl-12 pr-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-600"
              autoFocus
            />
          </div>
        </div>

        {/* Products List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {productosFiltrados.map(producto => (
            <div
              key={producto.id}
              className="bg-zinc-800 rounded-lg p-4 flex items-center gap-4 hover:bg-zinc-750 transition-colors"
            >
              {/* Imagen del producto */}
              <div className="w-16 h-16 bg-zinc-700 rounded-lg overflow-hidden flex-shrink-0">
                {producto.imagen ? (
                  <img
                    src={producto.imagen}
                    alt={producto.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {producto.categoria === 'Vinos' ? (
                      <Wine className="w-8 h-8 text-zinc-500" />
                    ) : (
                      <Package className="w-8 h-8 text-zinc-500" />
                    )}
                  </div>
                )}
              </div>

              {/* Info del producto */}
              <div className="flex-1">
                <p className="font-medium mb-1">{producto.nombre}</p>
                <p className="text-sm text-zinc-400">{producto.categoria}</p>
              </div>

              {/* Precio y botón */}
              <div className="flex items-center gap-4">
                <p className="text-red-500 font-medium text-lg">
                  ${producto.precio.toLocaleString()}
                </p>
                <button
                  onClick={() => handleAgregar(producto)}
                  className="bg-red-600 hover:bg-red-700 transition-colors rounded-lg px-4 py-2 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </button>
              </div>
            </div>
          ))}

          {productosFiltrados.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              No se encontraron productos
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
