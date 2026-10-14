import { useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Package, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { NuevoProductoModal } from './NuevoProductoModal.jsx';
import { ConfirmarEliminacionModal } from './ConfirmarEliminacionModal.jsx';
import { stockDisponible } from '../lib/stock.js';

export function CartaView({
  onVolver,
  categorias = [],
  productos = [],
  esAdministrador = false,
  onCrearProducto,
  onActualizarProducto,
  onEliminarProducto,
}) {
  const [categoria, setCategoria] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [productoEditando, setProductoEditando] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const categoriasVisibles = useMemo(() => {
    const presentes = new Set(productos.map((p) => p.categoria).filter(Boolean));
    return categorias.filter((c) => presentes.has(c.nombre));
  }, [categorias, productos]);

  const productosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return productos.filter((producto) => {
      const coincideCategoria = categoria === 'Todos' || producto.categoria === categoria;
      const coincideBusqueda = !termino ||
        producto.nombre?.toLowerCase().includes(termino) ||
        producto.categoria?.toLowerCase().includes(termino);
      return coincideCategoria && coincideBusqueda;
    });
  }, [productos, categoria, busqueda]);

  const grupos = useMemo(() => {
    return productosFiltrados.reduce((resultado, producto) => {
      const clave = producto.categoria || 'Sin categoría';
      (resultado[clave] ||= []).push(producto);
      return resultado;
    }, {});
  }, [productosFiltrados]);

  const abrirNuevo = () => {
    setProductoEditando(null);
    setModalAbierto(true);
  };

  const abrirEdicion = (producto) => {
    setProductoEditando(producto);
    setModalAbierto(true);
  };

  const guardarProducto = async (data) => {
    setGuardando(true);
    setError('');
    try {
      if (productoEditando) await onActualizarProducto(productoEditando.id, data);
      else await onCrearProducto(data);
      setModalAbierto(false);
      setProductoEditando(null);
    } catch (err) {
      setError(err.message || 'No se pudo guardar el producto');
    } finally {
      setGuardando(false);
    }
  };

  const cambiarDisponibilidad = async (producto) => {
    setError('');
    try {
      await onActualizarProducto(producto.id, { activo: producto.activo === false });
    } catch (err) {
      setError(err.message || 'No se pudo cambiar la disponibilidad');
    }
  };

  return (
    <>
      <div className="flex-1 bg-black text-white overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <button onClick={onVolver} className="p-2 hover:bg-zinc-800 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-red-500" /> Carta
                </h1>
                <p className="text-sm text-zinc-500">Productos y disponibilidad del local</p>
              </div>
            </div>
            {esAdministrador && (
              <button onClick={abrirNuevo} className="bg-red-600 hover:bg-red-700 px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Nuevo producto
              </button>
            )}
          </header>

          {error && <div className="mb-4 rounded-lg border border-red-700 bg-red-950/60 px-4 py-3 text-red-200">{error}</div>}

          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar producto o categoría..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-red-600"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-3 mb-3">
            {['Todos', ...categoriasVisibles.map((c) => c.nombre)].map((nombre) => (
              <button
                key={nombre}
                onClick={() => setCategoria(nombre)}
                className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap border ${
                  categoria === nombre
                    ? 'bg-red-600 border-red-600 text-white'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {nombre}
              </button>
            ))}
          </div>

          <div className="space-y-7 pb-20">
            {Object.entries(grupos).map(([nombreCategoria, items]) => (
              <section key={nombreCategoria}>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">{nombreCategoria}</h2>
                <div className="space-y-2">
                  {items.map((producto) => {
                    const stock = stockDisponible(producto);
                    const habilitado = producto.activo !== false;
                    const disponible = habilitado && stock > 0;
                    const bajoStock = disponible && stock <= (producto.stockMinimo ?? 5);
                    return (
                      <div key={producto.id} className={`flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 ${!disponible ? 'opacity-60' : ''}`}>
                        <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-zinc-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{producto.nombre}</p>
                          <div className="flex flex-wrap items-center gap-x-3 text-sm">
                            <span className="font-semibold text-red-500">${producto.precioMesa.toLocaleString()}</span>
                            <span className="text-zinc-500">Stock: {stock}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => esAdministrador && cambiarDisponibilidad(producto)}
                            disabled={!esAdministrador}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                              bajoStock
                                ? 'bg-amber-950 border-amber-800 text-amber-400'
                                : disponible
                                  ? 'bg-emerald-950 border-emerald-800 text-emerald-400'
                                  : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                            }`}
                            title={stock <= 0 ? 'Se habilitará automáticamente cuando haya stock' : undefined}
                          >
                            {!habilitado ? 'No disponible' : stock <= 0 ? 'Sin stock' : bajoStock ? 'Bajo stock' : 'Disponible'}
                          </button>
                          {esAdministrador && (
                            <>
                              <button onClick={() => abrirEdicion(producto)} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg" title="Editar producto">
                                <Pencil className="w-4 h-4 text-zinc-400" />
                              </button>
                              <button onClick={() => setProductoAEliminar(producto)} className="p-2 bg-zinc-800 hover:bg-red-950 rounded-lg" title="Eliminar producto">
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
            {Object.keys(grupos).length === 0 && (
              <div className="text-center text-zinc-500 py-14">No hay productos para mostrar.</div>
            )}
          </div>
        </div>
      </div>

      <NuevoProductoModal
        isOpen={modalAbierto}
        onClose={() => { setModalAbierto(false); setProductoEditando(null); }}
        onGuardar={guardarProducto}
        productoEditando={productoEditando}
        categorias={categorias}
        productos={productos}
        guardando={guardando}
      />

      <ConfirmarEliminacionModal
        isOpen={!!productoAEliminar}
        onClose={() => setProductoAEliminar(null)}
        onConfirmar={() => onEliminarProducto(productoAEliminar.id)}
        titulo="Eliminar producto"
        mensaje="Se quitará de la carta y del stock."
        nombreEntidad={productoAEliminar?.nombre}
      />
    </>
  );
}
