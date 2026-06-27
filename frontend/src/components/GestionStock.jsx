import { useState, useCallback } from 'react';
import { ArrowLeft, Plus, Search, Edit, Trash2, ScanBarcode } from 'lucide-react';
import { NuevoProductoModal } from './NuevoProductoModal.jsx';
import { ConfirmarEliminacionModal } from './ConfirmarEliminacionModal.jsx';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner.js';
import { productoCoincideBusqueda, productoPorCodBarra } from '../lib/productos.js';

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
  const [categoriaInicialModal, setCategoriaInicialModal] = useState(null);
  const [productoEditando, setProductoEditando] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [codBarraInicialModal, setCodBarraInicialModal] = useState('');

  const productosFiltrados = productos.filter((p) => {
    const matchBusqueda = productoCoincideBusqueda(p, busqueda);
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
        codbarra: data.codbarra,
        componentes: data.componentes || [],
      };
      if (productoEditando) {
        await onActualizarProducto(productoEditando.id, payload);
      } else {
        await onCrearProducto(payload);
      }
      setShowNuevoProductoModal(false);
      setProductoEditando(null);
      setCodBarraInicialModal('');
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

  const confirmarEliminarProducto = async () => {
    if (!productoAEliminar) return;
    setErrorMsg(null);
    await onEliminarProducto(productoAEliminar.id);
  };

  const abrirModalProducto = (categoriaInicial = null, codBarraInicial = '') => {
    setProductoEditando(null);
    setCategoriaInicialModal(categoriaInicial);
    setCodBarraInicialModal(codBarraInicial);
    setShowNuevoProductoModal(true);
  };

  const handleCerrarModal = () => {
    setShowNuevoProductoModal(false);
    setProductoEditando(null);
    setCategoriaInicialModal(null);
    setCodBarraInicialModal('');
  };

  const handleScanStock = useCallback(
    (codigo) => {
      const producto = productoPorCodBarra(productos, codigo);
      if (producto) {
        handleEditarProducto(producto);
        return;
      }
      abrirModalProducto(null, codigo);
    },
    [productos]
  );

  useBarcodeScanner({
    enabled: !showNuevoProductoModal,
    onScan: handleScanStock,
  });

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
        <header className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 border-b border-zinc-800">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button onClick={onVolver} className="hover:bg-zinc-800 p-2 rounded-lg transition-colors shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold truncate">Catálogo de Productos</h1>
                <p className="text-sm text-zinc-500 uppercase tracking-wide mt-1">
                  Club 22 - Gestión de Stock
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <button
                onClick={() => abrirModalProducto()}
                className="bg-zinc-800 hover:bg-zinc-700 transition-colors px-4 sm:px-6 py-3 rounded-lg flex items-center justify-center gap-2 border border-zinc-700 text-sm sm:text-base"
              >
                <Plus className="w-5 h-5" />
                Nuevo Producto
              </button>
              <button
                onClick={() => abrirModalProducto('Promociones')}
                className="bg-red-600 hover:bg-red-700 transition-colors px-4 sm:px-6 py-3 rounded-lg flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Plus className="w-5 h-5" />
                Nueva Promoción
              </button>
            </div>
          </div>
          {errorMsg && (
            <div className="mt-2 bg-red-900/40 border border-red-700 text-red-200 rounded-lg px-4 py-3 text-sm">
              {errorMsg}
            </div>
          )}
        </header>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <div className="relative mb-3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o código de barras..."
              data-barcode-scanner="true"
              className="w-full bg-zinc-900 rounded-lg pl-12 pr-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-600 border border-zinc-800"
            />
          </div>
          <p className="mb-6 text-sm text-zinc-500 flex items-center gap-2">
            <ScanBarcode className="w-4 h-4" />
            Escaneá un código para editar el producto o crear uno nuevo si no existe.
          </p>

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
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">Cód. Barra</th>
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
                        <td className="px-6 py-4">
                          <div>{producto.nombre}</div>
                          {producto.componentes?.length > 0 && (
                            <p className="text-xs text-zinc-500 mt-1">
                              Incluye: {producto.componentes.map((c) => `${c.cantidad}x ${c.nombre}`).join(', ')}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-zinc-400 font-mono text-sm">
                          {producto.codbarra ?? '—'}
                        </td>
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
                              onClick={() => setProductoAEliminar(producto)}
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
        productos={productos}
        guardando={guardando}
        categoriaInicial={categoriaInicialModal}
        codBarraInicial={codBarraInicialModal}
      />

      <ConfirmarEliminacionModal
        isOpen={!!productoAEliminar}
        onClose={() => setProductoAEliminar(null)}
        onConfirmar={confirmarEliminarProducto}
        titulo="Eliminar producto"
        mensaje="Se quitará del catálogo y ya no estará disponible para ventas."
        nombreEntidad={productoAEliminar?.nombre}
      />
    </>
  );
}
