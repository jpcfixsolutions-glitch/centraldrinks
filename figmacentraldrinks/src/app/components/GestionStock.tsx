import { useState } from 'react';
import { ArrowLeft, Plus, Search, Package, TrendingUp, Edit, Trash2 } from 'lucide-react';
import { NuevoProductoModal } from './NuevoProductoModal';

export interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  costoUnitario: number;
  precioMesa: number;
  precioMostrador: number;
  stock: number;
}

interface GestionStockProps {
  onVolver: () => void;
  categorias: { id: number; nombre: string }[];
}

export function GestionStock({ onVolver, categorias }: GestionStockProps) {
  const categoriasDisponibles = ['Todos', ...categorias.map(c => c.nombre)];
  const [productos, setProductos] = useState<Producto[]>([
    { id: 1, nombre: 'Promo Absolut + 2 Speed XL', categoria: 'Promociones', costoUnitario: 25000, precioMesa: 45000, precioMostrador: 30000, stock: 1000 },
    { id: 2, nombre: 'Promo Absolut + 2 Speed XL', categoria: 'Promociones', costoUnitario: 25000, precioMesa: 45000, precioMostrador: 30000, stock: 1000 },
    { id: 3, nombre: 'Promo fernet + coca de 2l retornable', categoria: 'Promociones', costoUnitario: 15000, precioMesa: 30000, precioMostrador: 20000, stock: 1000 },
    { id: 4, nombre: 'Promo Skyy + 2 Speed', categoria: 'Promociones', costoUnitario: 12000, precioMesa: 30000, precioMostrador: 15500, stock: 1000 },
    { id: 5, nombre: 'trago', categoria: 'Vinos', costoUnitario: 4000, precioMesa: 6000, precioMostrador: 6000, stock: 10000000 },
    { id: 6, nombre: 'Vino Santa Julia', categoria: 'Vinos', costoUnitario: 8000, precioMesa: 15000, precioMostrador: 11000, stock: 10 },
  ]);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todos');
  const [showNuevoProductoModal, setShowNuevoProductoModal] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);

  const productosFiltrados = productos.filter(p => {
    const matchBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const matchCategoria = categoriaSeleccionada === 'Todos' || p.categoria === categoriaSeleccionada;
    return matchBusqueda && matchCategoria;
  });

  const totalProductos = productos.length;
  const stockTotal = productos.reduce((sum, p) => sum + p.stock, 0);

  const handleAgregarProducto = (nuevoProducto: Omit<Producto, 'id'>) => {
    if (productoEditando) {
      setProductos(prev => prev.map(p =>
        p.id === productoEditando.id
          ? { ...nuevoProducto, id: productoEditando.id }
          : p
      ));
      setProductoEditando(null);
    } else {
      const nuevoId = Math.max(0, ...productos.map(p => p.id)) + 1;
      setProductos(prev => [...prev, { ...nuevoProducto, id: nuevoId }]);
    }
    setShowNuevoProductoModal(false);
  };

  const handleEditarProducto = (producto: Producto) => {
    setProductoEditando(producto);
    setShowNuevoProductoModal(true);
  };

  const handleEliminarProducto = (id: number) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      setProductos(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleCerrarModal = () => {
    setShowNuevoProductoModal(false);
    setProductoEditando(null);
  };

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'Promociones': return 'text-red-500';
      case 'Vinos': return 'text-purple-500';
      case 'Tapas': return 'text-yellow-500';
      case 'Cervezas': return 'text-amber-500';
      default: return 'text-zinc-400';
    }
  };

  const getEstadoStock = (stock: number) => {
    if (stock < 10) {
      return { texto: 'Muy bajo', color: 'bg-red-600/20 text-red-500 border-red-600' };
    } else if (stock < 15) {
      return { texto: 'Reponer', color: 'bg-yellow-600/20 text-yellow-500 border-yellow-600' };
    } else if (stock >= 20) {
      return { texto: 'Disponible', color: 'bg-green-600/20 text-green-500 border-green-600' };
    } else {
      return { texto: 'Normal', color: 'bg-blue-600/20 text-blue-500 border-blue-600' };
    }
  };

  return (
    <>
      <div className="flex-1 flex flex-col bg-black text-white">
        {/* Header */}
        <header className="px-8 py-6 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <button
                onClick={onVolver}
                className="hover:bg-zinc-800 p-2 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Catálogo de Productos</h1>
                <p className="text-sm text-zinc-500 uppercase tracking-wide mt-1">
                  Centraldrinks - Gestión de Stock
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowNuevoProductoModal(true)}
              className="bg-red-600 hover:bg-red-700 transition-colors px-6 py-3 rounded-lg flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nuevo Producto
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-8 overflow-auto">
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full bg-zinc-900 rounded-lg pl-12 pr-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-600 border border-zinc-800"
            />
          </div>

          {/* Category Filters */}
          <div className="flex gap-3 mb-6">
            {categoriasDisponibles.map(categoria => (
              <button
                key={categoria}
                onClick={() => setCategoriaSeleccionada(categoria)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  categoriaSeleccionada === categoria
                    ? 'bg-red-600 text-white'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                {categoria}
              </button>
            ))}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-red-500" />
                </div>
                <p className="text-zinc-400 text-sm uppercase tracking-wide">Productos</p>
              </div>
              <p className="text-4xl font-bold">{totalProductos}</p>
            </div>

            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
                <p className="text-zinc-400 text-sm uppercase tracking-wide">Stock Total</p>
              </div>
              <p className="text-4xl font-bold">{stockTotal.toLocaleString()}</p>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">
                      Producto
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">
                      Categoría
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">
                      Costo Unit.
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">
                      Precio Mesa
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">
                      Precio Mostr.
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">
                      Stock
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">
                      Estado
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.map(producto => (
                    <tr key={producto.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4">{producto.nombre}</td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${getCategoriaColor(producto.categoria)}`}>
                          • {producto.categoria}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-400">${producto.costoUnitario.toLocaleString()}</td>
                      <td className="px-6 py-4">${producto.precioMesa.toLocaleString()}</td>
                      <td className="px-6 py-4">${producto.precioMostrador.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className="font-medium">{producto.stock.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const estado = getEstadoStock(producto.stock);
                          return (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${estado.color}`}>
                              {estado.texto}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditarProducto(producto)}
                            className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEliminarProducto(producto.id)}
                            className="p-2 hover:bg-red-600/20 rounded-lg transition-colors text-zinc-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {productosFiltrados.length === 0 && (
                <div className="text-center py-12 text-zinc-500">
                  No se encontraron productos
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <NuevoProductoModal
        isOpen={showNuevoProductoModal}
        onClose={handleCerrarModal}
        onGuardar={handleAgregarProducto}
        productoEditando={productoEditando}
        categorias={categorias}
      />
    </>
  );
}
