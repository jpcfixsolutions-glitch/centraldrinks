import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit, Trash2, CreditCard, Tag } from 'lucide-react';

interface MetodoPago {
  id: number;
  nombre: string;
  recargo: number; // porcentaje, puede ser negativo para descuento
}

interface CategoriaProducto {
  id: number;
  nombre: string;
}

interface ConfiguracionProps {
  onVolver: () => void;
  metodosPago: MetodoPago[];
  setMetodosPago: React.Dispatch<React.SetStateAction<MetodoPago[]>>;
  categorias: CategoriaProducto[];
  setCategorias: React.Dispatch<React.SetStateAction<CategoriaProducto[]>>;
}

export function Configuracion({ onVolver, metodosPago, setMetodosPago, categorias, setCategorias }: ConfiguracionProps) {
  const [seccionActiva, setSeccionActiva] = useState<'metodos-pago' | 'categorias'>('metodos-pago');

  // Métodos de pago
  const [showMetodoPagoModal, setShowMetodoPagoModal] = useState(false);
  const [metodoPagoEditando, setMetodoPagoEditando] = useState<MetodoPago | null>(null);

  // Categorías
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState<CategoriaProducto | null>(null);

  // Métodos de pago handlers
  const handleAgregarMetodoPago = () => {
    setMetodoPagoEditando(null);
    setShowMetodoPagoModal(true);
  };

  const handleEditarMetodoPago = (metodo: MetodoPago) => {
    setMetodoPagoEditando(metodo);
    setShowMetodoPagoModal(true);
  };

  const handleEliminarMetodoPago = (id: number) => {
    if (confirm('¿Estás seguro de eliminar este método de pago?')) {
      setMetodosPago(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleGuardarMetodoPago = (nombre: string, recargo: number) => {
    if (metodoPagoEditando) {
      setMetodosPago(prev => prev.map(m =>
        m.id === metodoPagoEditando.id ? { ...m, nombre, recargo } : m
      ));
    } else {
      const nuevoId = Math.max(0, ...metodosPago.map(m => m.id)) + 1;
      setMetodosPago(prev => [...prev, { id: nuevoId, nombre, recargo }]);
    }
    setShowMetodoPagoModal(false);
    setMetodoPagoEditando(null);
  };

  // Categorías handlers
  const handleAgregarCategoria = () => {
    setCategoriaEditando(null);
    setShowCategoriaModal(true);
  };

  const handleEditarCategoria = (categoria: CategoriaProducto) => {
    setCategoriaEditando(categoria);
    setShowCategoriaModal(true);
  };

  const handleEliminarCategoria = (id: number) => {
    if (confirm('¿Estás seguro de eliminar esta categoría?')) {
      setCategorias(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleGuardarCategoria = (nombre: string) => {
    if (categoriaEditando) {
      setCategorias(prev => prev.map(c =>
        c.id === categoriaEditando.id ? { ...c, nombre } : c
      ));
    } else {
      const nuevoId = Math.max(0, ...categorias.map(c => c.id)) + 1;
      setCategorias(prev => [...prev, { id: nuevoId, nombre }]);
    }
    setShowCategoriaModal(false);
    setCategoriaEditando(null);
  };

  return (
    <>
      <div className="flex-1 flex flex-col bg-black text-white">
        {/* Header */}
        <header className="px-8 py-6 border-b border-zinc-800">
          <div className="flex items-center gap-4">
            <button
              onClick={onVolver}
              className="hover:bg-zinc-800 p-2 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Configuración</h1>
              <p className="text-sm text-zinc-500 uppercase tracking-wide mt-1">
                Centraldrinks - Parámetros del Sistema
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 flex">
          {/* Sidebar de secciones */}
          <div className="w-64 border-r border-zinc-800 p-6">
            <h3 className="text-xs text-zinc-500 uppercase tracking-wide mb-4">Secciones</h3>
            <div className="space-y-2">
              <button
                onClick={() => setSeccionActiva('metodos-pago')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  seccionActiva === 'metodos-pago'
                    ? 'bg-red-600 text-white'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                Métodos de Pago
              </button>
              <button
                onClick={() => setSeccionActiva('categorias')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  seccionActiva === 'categorias'
                    ? 'bg-red-600 text-white'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <Tag className="w-5 h-5" />
                Categorías de Productos
              </button>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="flex-1 p-8 overflow-auto">
            {seccionActiva === 'metodos-pago' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Métodos de Pago</h2>
                  <button
                    onClick={handleAgregarMetodoPago}
                    className="bg-red-600 hover:bg-red-700 transition-colors px-6 py-3 rounded-lg flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Nuevo Método
                  </button>
                </div>

                <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">
                          Nombre
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">
                          Recargo/Descuento
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {metodosPago.map(metodo => (
                        <tr key={metodo.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                          <td className="px-6 py-4 font-medium">{metodo.nombre}</td>
                          <td className="px-6 py-4">
                            <span className={metodo.recargo > 0 ? 'text-red-500' : metodo.recargo < 0 ? 'text-green-500' : 'text-zinc-400'}>
                              {metodo.recargo > 0 ? '+' : ''}{metodo.recargo}%
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditarMetodoPago(metodo)}
                                className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEliminarMetodoPago(metodo.id)}
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
                </div>
              </div>
            )}

            {seccionActiva === 'categorias' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Categorías de Productos</h2>
                  <button
                    onClick={handleAgregarCategoria}
                    className="bg-red-600 hover:bg-red-700 transition-colors px-6 py-3 rounded-lg flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Nueva Categoría
                  </button>
                </div>

                <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">
                          Nombre
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {categorias.map(categoria => (
                        <tr key={categoria.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                          <td className="px-6 py-4 font-medium">{categoria.nombre}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditarCategoria(categoria)}
                                className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEliminarCategoria(categoria.id)}
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
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modales */}
      <ModalMetodoPago
        isOpen={showMetodoPagoModal}
        onClose={() => {
          setShowMetodoPagoModal(false);
          setMetodoPagoEditando(null);
        }}
        onGuardar={handleGuardarMetodoPago}
        metodoEditando={metodoPagoEditando}
      />

      <ModalCategoria
        isOpen={showCategoriaModal}
        onClose={() => {
          setShowCategoriaModal(false);
          setCategoriaEditando(null);
        }}
        onGuardar={handleGuardarCategoria}
        categoriaEditando={categoriaEditando}
      />
    </>
  );
}

// Modal Método de Pago
interface ModalMetodoPagoProps {
  isOpen: boolean;
  onClose: () => void;
  onGuardar: (nombre: string, recargo: number) => void;
  metodoEditando: MetodoPago | null;
}

function ModalMetodoPago({ isOpen, onClose, onGuardar, metodoEditando }: ModalMetodoPagoProps) {
  const [nombre, setNombre] = useState('');
  const [recargo, setRecargo] = useState('0');

  useEffect(() => {
    if (isOpen) {
      if (metodoEditando) {
        setNombre(metodoEditando.nombre);
        setRecargo(metodoEditando.recargo.toString());
      } else {
        setNombre('');
        setRecargo('0');
      }
    }
  }, [isOpen, metodoEditando]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      alert('Por favor ingresa un nombre');
      return;
    }
    onGuardar(nombre.trim(), parseFloat(recargo) || 0);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-lg w-full max-w-md">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold">
            {metodoEditando ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs text-zinc-400 mb-2 uppercase tracking-wide">
              Nombre del Método
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600 border border-zinc-700"
              placeholder="Ej: Tarjeta Débito"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-2 uppercase tracking-wide">
              Recargo/Descuento (%)
            </label>
            <input
              type="number"
              value={recargo}
              onChange={(e) => setRecargo(e.target.value)}
              className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600 border border-zinc-700"
              placeholder="0"
              step="0.01"
            />
            <p className="text-xs text-zinc-500 mt-2">
              Positivo para recargo, negativo para descuento
            </p>
          </div>

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
              {metodoEditando ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal Categoría
interface ModalCategoriaProps {
  isOpen: boolean;
  onClose: () => void;
  onGuardar: (nombre: string) => void;
  categoriaEditando: CategoriaProducto | null;
}

function ModalCategoria({ isOpen, onClose, onGuardar, categoriaEditando }: ModalCategoriaProps) {
  const [nombre, setNombre] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (categoriaEditando) {
        setNombre(categoriaEditando.nombre);
      } else {
        setNombre('');
      }
    }
  }, [isOpen, categoriaEditando]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      alert('Por favor ingresa un nombre');
      return;
    }
    onGuardar(nombre.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-lg w-full max-w-md">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold">
            {categoriaEditando ? 'Editar Categoría' : 'Nueva Categoría'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs text-zinc-400 mb-2 uppercase tracking-wide">
              Nombre de la Categoría
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600 border border-zinc-700"
              placeholder="Ej: Bebidas"
              autoFocus
            />
          </div>

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
              {categoriaEditando ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
