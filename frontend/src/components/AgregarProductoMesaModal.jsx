import { useState } from 'react';
import { X, Search, Plus, Wine, Package } from 'lucide-react';
import { StockAviso } from './StockAviso.jsx';
import { esSinStock, stockDisponible, validarCantidadStock } from '../lib/stock.js';

export function AgregarProductoMesaModal({ isOpen, onClose, onAgregar, productos = [], cantidadesCarrito = {} }) {
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const productosFiltrados = productos.filter((p) => {
    const nombre = p.nombre?.toLowerCase() ?? '';
    const categoria = p.categoria?.toLowerCase() ?? '';
    const term = busqueda.toLowerCase();
    return nombre.includes(term) || categoria.includes(term);
  });

  const handleAgregar = (producto) => {
    const cantidadEnCarrito = cantidadesCarrito[producto.id] ?? 0;
    const validacion = validarCantidadStock(producto, cantidadEnCarrito + 1);
    if (!validacion.ok) {
      setError(validacion.mensaje);
      return;
    }

    setError('');
    onAgregar({
      id: producto.id,
      nombre: producto.nombre,
      categoria: producto.categoria || 'Sin categoría',
      precio: producto.precioMesa,
      imagen: producto.imagen,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold">Agregar Producto</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 border-b border-zinc-800">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setError('');
              }}
              placeholder="Buscar por nombre o categoría..."
              className="w-full bg-zinc-800 rounded-lg pl-12 pr-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-600"
              autoFocus
            />
          </div>
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {productosFiltrados.map((producto) => {
            const sinStock = esSinStock(producto);
            const cantidadEnCarrito = cantidadesCarrito[producto.id] ?? 0;
            const noPuedeAgregar =
              sinStock || cantidadEnCarrito >= stockDisponible(producto);

            return (
              <div
                key={producto.id}
                className="bg-zinc-800 rounded-lg p-4 flex items-center gap-4 hover:bg-zinc-750 transition-colors"
              >
                <div className="w-16 h-16 bg-zinc-700 rounded-lg overflow-hidden flex-shrink-0">
                  {producto.imagen ? (
                    <img src={producto.imagen} alt={producto.nombre} className="w-full h-full object-cover" />
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

                <div className="flex-1">
                  <p className="font-medium mb-1">{producto.nombre}</p>
                  <p className="text-sm text-zinc-400">{producto.categoria || 'Sin categoría'}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Stock: {stockDisponible(producto)}
                    {producto.componentes?.length > 0 && ' (según componentes)'}
                    {cantidadEnCarrito > 0 && ` · En carrito: ${cantidadEnCarrito}`}
                  </p>
                  <StockAviso producto={producto} />
                </div>

                <div className="flex items-center gap-4">
                  <p className="text-red-500 font-medium text-lg">${producto.precioMesa.toLocaleString()}</p>
                  <button
                    onClick={() => handleAgregar(producto)}
                    className="bg-red-600 hover:bg-red-700 transition-colors rounded-lg px-4 py-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={noPuedeAgregar}
                    title={sinStock ? 'Sin stock disponible' : noPuedeAgregar ? 'Stock máximo en carrito' : undefined}
                  >
                    <Plus className="w-4 h-4" />
                    Agregar
                  </button>
                </div>
              </div>
            );
          })}

          {productosFiltrados.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              {productos.length === 0
                ? 'No hay productos cargados. Agregalos desde "Gestión de Stock".'
                : 'No se encontraron productos.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
