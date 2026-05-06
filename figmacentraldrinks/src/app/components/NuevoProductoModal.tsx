import { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import type { Producto } from './GestionStock';

interface NuevoProductoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGuardar: (producto: Omit<Producto, 'id'>) => void;
  productoEditando: Producto | null;
  categorias: { id: number; nombre: string }[];
}

export function NuevoProductoModal({ isOpen, onClose, onGuardar, productoEditando, categorias }: NuevoProductoModalProps) {
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState(categorias[0]?.nombre || '');
  const [costoUnitario, setCostoUnitario] = useState('');
  const [precioMesa, setPrecioMesa] = useState('');
  const [precioMostrador, setPrecioMostrador] = useState('');
  const [stockInicial, setStockInicial] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (productoEditando) {
        setNombre(productoEditando.nombre);
        setCategoria(productoEditando.categoria);
        setCostoUnitario(productoEditando.costoUnitario.toString());
        setPrecioMesa(productoEditando.precioMesa.toString());
        setPrecioMostrador(productoEditando.precioMostrador.toString());
        setStockInicial(productoEditando.stock.toString());
      } else {
        setNombre('');
        setCategoria(categorias[0]?.nombre || '');
        setCostoUnitario('');
        setPrecioMesa('');
        setPrecioMostrador('');
        setStockInicial('');
      }
    }
  }, [isOpen, productoEditando, categorias]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim() || !costoUnitario || !precioMesa || !precioMostrador || !stockInicial) {
      alert('Por favor completa todos los campos');
      return;
    }

    onGuardar({
      nombre: nombre.trim(),
      categoria,
      costoUnitario: parseFloat(costoUnitario),
      precioMesa: parseFloat(precioMesa),
      precioMostrador: parseFloat(precioMostrador),
      stock: parseInt(stockInicial),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-red-500" />
            </div>
            <h2 className="text-xl font-bold">
              {productoEditando ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Nombre */}
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
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-xs text-zinc-400 mb-2 uppercase tracking-wide">
              Categoría
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600 border border-zinc-700"
            >
              {categorias.map(cat => (
                <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
              ))}
            </select>
          </div>

          {/* Costo Unitario */}
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
            />
          </div>

          {/* Precios */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-2 uppercase tracking-wide">
                Precio Mesa
              </label>
              <input
                type="number"
                value={precioMesa}
                onChange={(e) => setPrecioMesa(e.target.value)}
                className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600 border border-zinc-700"
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-2 uppercase tracking-wide">
                Precio Mostr.
              </label>
              <input
                type="number"
                value={precioMostrador}
                onChange={(e) => setPrecioMostrador(e.target.value)}
                className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600 border border-zinc-700"
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Stock Inicial */}
          <div>
            <label className="block text-xs text-zinc-400 mb-2 uppercase tracking-wide">
              Stock Inicial
            </label>
            <input
              type="number"
              value={stockInicial}
              onChange={(e) => setStockInicial(e.target.value)}
              className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600 border border-zinc-700"
              placeholder="0"
              min="0"
              step="1"
            />
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-zinc-800 hover:bg-zinc-700 transition-colors rounded-lg py-3 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 transition-colors rounded-lg py-3 font-medium"
            >
              {productoEditando ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
