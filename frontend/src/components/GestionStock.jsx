import { useState } from 'react';
import { ArrowLeft, Plus, Search, Edit, Trash2 } from 'lucide-react';
import { NuevoProductoModal } from './NuevoProductoModal.jsx';

export function GestionStock({
  onVolver,
  categorias,
  productos,
  onCrearProducto,
  onActualizarProducto,
  onEliminarProducto,
}) {
  const categoriasDisponibles = ['Todos', ...categorias.map((c) => c.nombre)];
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todos');
  const [showNuevoProductoModal, setShowNuevoProductoModal] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const productosFiltrados = productos.filter((p) => {
    const matchBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const matchCategoria = categoriaSeleccionada === 'Todos' || p.categoria === categoriaSeleccionada;
    return matchBusqueda && matchCategoria;
  });

  const handleGuardarProducto = async (data) => {
    setErrorMsg(null);
    setGuardando(true);
    try {
      const payload = {
        nombre: data.nombre,
        categoriaId: data.categoriaId,
        costoUnitario: data.costoUnitario,
        precioMesa: data.precioMesa,
        precioMostrador: data.precioMostrador,
        stock: data.stock,
        stockMinimo: data.stockMinimo,
      };
      if (productoEditando) {
        await onActualizarProducto(productoEditando.id, payload);
      } else {
        await onCrearProducto(payload);
      }
      setShowNuevoProductoModal(false);
      setProductoEditando(null);
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar producto');
    } finally {
      setGuardando(false);
    }
  };

  const handleEditarProducto = (producto) => {
    setProductoEditando(producto);
    setShowNuevoProductoModal(true);
  };

  const handleEliminarProducto = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    setErrorMsg(null);
    try {
      await onEliminarProducto(id);
    } catch (err) {
      setErrorMsg(err.message || 'Error al eliminar producto');
    }
  };

  const handleCerrarModal = () => {
    setShowNuevoProductoModal(false);
    setProductoEditando(null);
  };

  const getCategoriaColor = (categoria) => {
    switch (categoria) {
      case 'Promociones':
        return 'text-red-500';
      case 'Vinos':
        return 'text-purple-500';
      case 'Tapas':
        return 'text-yellow-500';
      case 'Cervezas':
        return 'text-amber-500';
      default:
        return 'text-zinc-400';
    }
  };

  const getEstadoStock = (stock, stockMinimo = 5) => {
    if (stock <= stockMinimo) return { texto: 'Reponer', color: 'bg-red-600/20 text-red-500 border-red-600' };
    if (stock <= stockMinimo + 5) return { texto: 'Bajo', color: 'bg-yellow-600/20 text-yellow-500 border-yellow-600' };
    return { texto: 'Normal', color: 'bg-blue-600/20 text-blue-500 border-blue-600' };
  };

  return (
    <>
      <div className="flex-1 flex flex-col bg-black text-white">
        <header className="px-8 py-6 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <button onClick={onVolver} className="hover:bg-zinc-800 p-2 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Catálogo de Productos</h1>
                <p className="text-sm text-zinc-500 uppercase tracking-wide mt-1">
                  Club 22 - Gestión de Stock
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setProductoEditando(null);
                setShowNuevoProductoModal(true);
              }}
              className="bg-red-600 hover:bg-red-700 transition-colors px-6 py-3 rounded-lg flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nuevo Producto
            </button>
          </div>
          {errorMsg && (
            <div className="mt-2 bg-red-900/40 border border-red-700 text-red-200 rounded-lg px-4 py-3 text-sm">
              {errorMsg}
            </div>
          )}
        </header>

        <div className="flex-1 p-8 overflow-auto">
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

          <div className="flex gap-3 mb-6 flex-wrap">
            {categoriasDisponibles.map((categoria) => (
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

          <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">Producto</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">Categoría</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">Costo Unit.</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">Precio Mesa</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">Precio Mostr.</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">Stock</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">Mínimo</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">Estado</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.map((producto) => {
                    const estado = getEstadoStock(producto.stock, producto.stockMinimo);
                    return (
                      <tr key={producto.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                        <td className="px-6 py-4">{producto.nombre}</td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-medium ${getCategoriaColor(producto.categoria)}`}>
                            • {producto.categoria || 'Sin categoría'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-400">${producto.costoUnitario.toLocaleString()}</td>
                        <td className="px-6 py-4">${producto.precioMesa.toLocaleString()}</td>
                        <td className="px-6 py-4">${producto.precioMostrador.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className="font-medium">{producto.stock.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4 text-zinc-400">
                          {producto.stockMinimo || 5}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${estado.color}`}>
                            {estado.texto}
                          </span>
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
                    );
                  })}
                </tbody>
              </table>

              {productosFiltrados.length === 0 && (
                <div className="text-center py-12 text-zinc-500">
                  {productos.length === 0
                    ? 'Aún no hay productos. Creá uno con "Nuevo Producto".'
                    : 'No se encontraron productos con ese filtro.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <NuevoProductoModal
        isOpen={showNuevoProductoModal}
        onClose={handleCerrarModal}
        onGuardar={handleGuardarProducto}
        productoEditando={productoEditando}
        categorias={categorias}
        guardando={guardando}
      />
    </>
  );
}
