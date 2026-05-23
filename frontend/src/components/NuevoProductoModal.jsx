import { useState, useEffect, useMemo } from 'react';
import { Package, Plus, Trash2 } from 'lucide-react';

export function NuevoProductoModal({
  isOpen,
  onClose,
  onGuardar,
  productoEditando,
  categorias,
  productos = [],
  guardando,
  categoriaInicial = null,
}) {
  const [nombre, setNombre] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [costoUnitario, setCostoUnitario] = useState('');
  const [precioMesa, setPrecioMesa] = useState('');
  const [precioMostrador, setPrecioMostrador] = useState('');
  const [stockInicial, setStockInicial] = useState('');
  const [stockMinimo, setStockMinimo] = useState('');
  const [componentes, setComponentes] = useState([]);

  const categoriaSeleccionada = categorias.find((c) => String(c.id) === categoriaId);
  const esPromocion = categoriaSeleccionada?.nombre === 'Promociones';

  const productosDisponibles = useMemo(() => {
    const idsUsados = new Set(componentes.map((c) => c.productoId));
    return productos.filter((p) => {
      if (productoEditando && p.id === productoEditando.id) return false;
      if (p.categoria === 'Promociones') return false;
      if (idsUsados.has(p.id)) return false;
      return true;
    });
  }, [productos, componentes, productoEditando]);

  const stockCalculado = useMemo(() => {
    if (!esPromocion || componentes.length === 0) return 0;
    return Math.min(
      ...componentes.map((c) => {
        const prod = productos.find((p) => p.id === c.productoId);
        if (!prod) return 0;
        return Math.floor(prod.stock / c.cantidad);
      })
    );
  }, [esPromocion, componentes, productos]);

  useEffect(() => {
    if (isOpen) {
      if (productoEditando) {
        setNombre(productoEditando.nombre);
        setCategoriaId(productoEditando.categoriaId ? String(productoEditando.categoriaId) : '');
        setCostoUnitario(productoEditando.costoUnitario.toString());
        setPrecioMesa(productoEditando.precioMesa.toString());
        setPrecioMostrador(productoEditando.precioMostrador.toString());
        setStockInicial(productoEditando.stock.toString());
        setStockMinimo(productoEditando.stockMinimo?.toString() || '5');
        setComponentes(
          (productoEditando.componentes ?? []).map((c) => ({
            productoId: c.productoId,
            cantidad: c.cantidad,
          }))
        );
      } else {
        const categoriaDefault = categoriaInicial
          ? categorias.find((c) => c.nombre === categoriaInicial)
          : categorias[0];
        setNombre('');
        setCategoriaId(categoriaDefault?.id ? String(categoriaDefault.id) : '');
        setCostoUnitario('');
        setPrecioMesa('');
        setPrecioMostrador('');
        setStockInicial('');
        setStockMinimo('');
        setComponentes([]);
      }
    }
  }, [isOpen, productoEditando, categorias, categoriaInicial]);

  useEffect(() => {
    if (!esPromocion) {
      setComponentes([]);
    }
  }, [esPromocion]);

  if (!isOpen) return null;

  const agregarComponente = () => {
    if (productosDisponibles.length === 0) return;
    setComponentes((prev) => [
      ...prev,
      { productoId: productosDisponibles[0].id, cantidad: 1 },
    ]);
  };

  const actualizarComponente = (index, campo, valor) => {
    setComponentes((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [campo]: valor } : c))
    );
  };

  const eliminarComponente = (index) => {
    setComponentes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!nombre.trim() || !costoUnitario || !precioMesa || !precioMostrador) {
      alert('Por favor completa todos los campos');
      return;
    }

    if (esPromocion && componentes.length === 0) {
      alert('Una promoción debe incluir al menos un producto componente');
      return;
    }

    if (!esPromocion && stockInicial === '') {
      alert('Por favor completa todos los campos');
      return;
    }

    onGuardar({
      nombre: nombre.trim(),
      categoriaId: categoriaId ? Number(categoriaId) : null,
      costoUnitario: parseFloat(costoUnitario),
      precioMesa: parseFloat(precioMesa),
      precioMostrador: parseFloat(precioMostrador),
      stock: esPromocion ? 0 : parseInt(stockInicial, 10),
      stockMinimo: stockMinimo ? parseInt(stockMinimo, 10) : 5,
      componentes: esPromocion ? componentes : [],
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-red-500" />
            </div>
            <h2 className="text-xl font-bold">
              {productoEditando
                ? esPromocion
                  ? 'Editar Promoción'
                  : 'Editar Producto'
                : esPromocion
                  ? 'Nueva Promoción'
                  : 'Nuevo Producto'}
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs text-zinc-400 mb-2 uppercase tracking-wide">
              Nombre del Producto
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600 border border-zinc-700"
              placeholder="Ej: Vino Malbec"
              disabled={guardando}
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-2 uppercase tracking-wide">Categoría</label>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600 border border-zinc-700"
              disabled={guardando}
            >
              <option value="">Sin categoría</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>

          {esPromocion && (
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs text-zinc-400 uppercase tracking-wide">
                  Productos que conforman la promoción
                </label>
                <button
                  type="button"
                  onClick={agregarComponente}
                  disabled={guardando || productosDisponibles.length === 0}
                  className="text-red-500 hover:text-red-400 text-sm flex items-center gap-1 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </button>
              </div>

              {componentes.length === 0 && (
                <p className="text-sm text-zinc-500">
                  {productos.filter((p) => p.categoria !== 'Promociones').length === 0
                    ? 'Primero cargá productos normales (vinos, cervezas, etc.) para armar la promoción.'
                    : 'Seleccioná los productos que incluye esta promoción.'}
                </p>
              )}

              {componentes.map((componente, index) => {
                const productoInfo = productos.find((p) => p.id === componente.productoId);
                const opciones = [
                  ...(productoInfo ? [productoInfo] : []),
                  ...productosDisponibles,
                ].filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i);

                return (
                  <div key={index} className="flex items-center gap-2">
                    <select
                      value={componente.productoId}
                      onChange={(e) =>
                        actualizarComponente(index, 'productoId', Number(e.target.value))
                      }
                      className="flex-1 bg-zinc-800 rounded-lg px-3 py-2 text-white text-sm border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-600"
                      disabled={guardando}
                    >
                      {opciones.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} (stock: {p.stock})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={componente.cantidad}
                      onChange={(e) =>
                        actualizarComponente(index, 'cantidad', parseInt(e.target.value, 10) || 1)
                      }
                      className="w-20 bg-zinc-800 rounded-lg px-3 py-2 text-white text-sm border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-600"
                      disabled={guardando}
                      title="Cantidad"
                    />
                    <button
                      type="button"
                      onClick={() => eliminarComponente(index)}
                      className="p-2 hover:bg-red-600/20 rounded-lg text-zinc-400 hover:text-red-500"
                      disabled={guardando}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}

              {componentes.length > 0 && (
                <p className="text-sm text-zinc-400">
                  Stock disponible de la promoción:{' '}
                  <span className="text-white font-medium">{stockCalculado}</span> unidades
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs text-zinc-400 mb-2 uppercase tracking-wide">
              Costo Unitario
            </label>
            <input
              type="number"
              value={costoUnitario}
              onChange={(e) => setCostoUnitario(e.target.value)}
              className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600 border border-zinc-700"
              placeholder="0"
              min="0"
              step="0.01"
              disabled={guardando}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-2 uppercase tracking-wide">Precio Mesa</label>
              <input
                type="number"
                value={precioMesa}
                onChange={(e) => setPrecioMesa(e.target.value)}
                className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600 border border-zinc-700"
                placeholder="0"
                min="0"
                step="0.01"
                disabled={guardando}
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-2 uppercase tracking-wide">Precio Mostr.</label>
              <input
                type="number"
                value={precioMostrador}
                onChange={(e) => setPrecioMostrador(e.target.value)}
                className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600 border border-zinc-700"
                placeholder="0"
                min="0"
                step="0.01"
                disabled={guardando}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!esPromocion ? (
              <div>
                <label className="block text-xs text-zinc-400 mb-2 uppercase tracking-wide">Stock Inicial</label>
                <input
                  type="number"
                  value={stockInicial}
                  onChange={(e) => setStockInicial(e.target.value)}
                  className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600 border border-zinc-700"
                  placeholder="0"
                  min="0"
                  step="1"
                  disabled={guardando}
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs text-zinc-400 mb-2 uppercase tracking-wide">Stock</label>
                <div className="w-full bg-zinc-800/50 rounded-lg px-4 py-3 text-zinc-400 border border-zinc-700">
                  {stockCalculado} (calculado)
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs text-zinc-400 mb-2 uppercase tracking-wide">Stock Mínimo</label>
              <input
                type="number"
                value={stockMinimo}
                onChange={(e) => setStockMinimo(e.target.value)}
                className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600 border border-zinc-700"
                placeholder="5"
                min="0"
                step="1"
                disabled={guardando}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-zinc-800 hover:bg-zinc-700 transition-colors rounded-lg py-3 font-medium disabled:opacity-50"
              disabled={guardando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 transition-colors rounded-lg py-3 font-medium disabled:opacity-50"
              disabled={guardando}
            >
              {guardando ? 'Guardando...' : productoEditando ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
