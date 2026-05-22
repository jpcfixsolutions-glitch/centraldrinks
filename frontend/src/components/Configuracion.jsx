import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit, Trash2, CreditCard, Tag, Building } from 'lucide-react';
import { ConfirmarEliminacionModal } from './ConfirmarEliminacionModal.jsx';

const ELIMINAR_CONFIG = {
  metodo: {
    titulo: 'Eliminar método de pago',
    mensaje: 'Se quitará este método de las opciones de cobro.',
  },
  categoria: {
    titulo: 'Eliminar categoría',
    mensaje: 'Los productos asociados pueden quedar sin categoría válida.',
  },
  gasto: {
    titulo: 'Eliminar gasto fijo',
    mensaje: 'Se dejará de considerar este gasto en los cálculos mensuales.',
  },
};

export function Configuracion({
  onVolver,
  metodosPago,
  onCrearMetodoPago,
  onActualizarMetodoPago,
  onEliminarMetodoPago,
  categorias,
  onCrearCategoria,
  onActualizarCategoria,
  onEliminarCategoria,
  gastosFijos = [],
  onCrearGastoFijo,
  onActualizarGastoFijo,
  onEliminarGastoFijo,
}) {
  const [seccionActiva, setSeccionActiva] = useState('metodos-pago');
  const [errorMsg, setErrorMsg] = useState(null);

  const [showMetodoPagoModal, setShowMetodoPagoModal] = useState(false);
  const [metodoPagoEditando, setMetodoPagoEditando] = useState(null);

  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState(null);

  const [showGastoFijoModal, setShowGastoFijoModal] = useState(false);
  const [gastoFijoEditando, setGastoFijoEditando] = useState(null);

  const [guardando, setGuardando] = useState(false);
  const [eliminarPendiente, setEliminarPendiente] = useState(null);

  const ejecutarOp = async (fn) => {
    setErrorMsg(null);
    setGuardando(true);
    try {
      await fn();
      return true;
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar');
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const handleAgregarMetodoPago = () => {
    setMetodoPagoEditando(null);
    setShowMetodoPagoModal(true);
  };

  const handleEditarMetodoPago = (metodo) => {
    setMetodoPagoEditando(metodo);
    setShowMetodoPagoModal(true);
  };

  const solicitarEliminar = (tipo, item) => {
    setEliminarPendiente({ tipo, id: item.id, nombre: item.nombre });
  };

  const confirmarEliminacion = async () => {
    if (!eliminarPendiente) return;
    const { tipo, id } = eliminarPendiente;
    if (tipo === 'metodo') await onEliminarMetodoPago(id);
    else if (tipo === 'categoria') await onEliminarCategoria(id);
    else if (tipo === 'gasto') await onEliminarGastoFijo(id);
  };

  const handleGuardarMetodoPago = async (nombre, recargo) => {
    const ok = await ejecutarOp(async () => {
      if (metodoPagoEditando) {
        await onActualizarMetodoPago(metodoPagoEditando.id, { nombre, recargo });
      } else {
        await onCrearMetodoPago({ nombre, recargo });
      }
    });
    if (ok) {
      setShowMetodoPagoModal(false);
      setMetodoPagoEditando(null);
    }
  };

  const handleAgregarCategoria = () => {
    setCategoriaEditando(null);
    setShowCategoriaModal(true);
  };

  const handleEditarCategoria = (categoria) => {
    setCategoriaEditando(categoria);
    setShowCategoriaModal(true);
  };

  const handleGuardarCategoria = async (nombre) => {
    const ok = await ejecutarOp(async () => {
      if (categoriaEditando) {
        await onActualizarCategoria(categoriaEditando.id, nombre);
      } else {
        await onCrearCategoria(nombre);
      }
    });
    if (ok) {
      setShowCategoriaModal(false);
      setCategoriaEditando(null);
    }
  };

  const handleAgregarGastoFijo = () => {
    setGastoFijoEditando(null);
    setShowGastoFijoModal(true);
  };

  const handleEditarGastoFijo = (gasto) => {
    setGastoFijoEditando(gasto);
    setShowGastoFijoModal(true);
  };

  const handleGuardarGastoFijo = async (nombre, monto) => {
    const ok = await ejecutarOp(async () => {
      if (gastoFijoEditando) {
        await onActualizarGastoFijo(gastoFijoEditando.id, { nombre, monto });
      } else {
        await onCrearGastoFijo({ nombre, monto });
      }
    });
    if (ok) {
      setShowGastoFijoModal(false);
      setGastoFijoEditando(null);
    }
  };

  return (
    <>
      <div className="flex-1 flex flex-col bg-black text-white">
        <header className="px-8 py-6 border-b border-zinc-800">
          <div className="flex items-center gap-4">
            <button onClick={onVolver} className="hover:bg-zinc-800 p-2 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Configuración</h1>
              <p className="text-sm text-zinc-500 uppercase tracking-wide mt-1">
                Club 22 - Parámetros del Sistema
              </p>
            </div>
          </div>
          {errorMsg && (
            <div className="mt-4 bg-red-900/40 border border-red-700 text-red-200 rounded-lg px-4 py-3 text-sm">
              {errorMsg}
            </div>
          )}
        </header>

        <div className="flex-1 flex">
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
              <button
                onClick={() => setSeccionActiva('gastos-fijos')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  seccionActiva === 'gastos-fijos'
                    ? 'bg-red-600 text-white'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <Building className="w-5 h-5" />
                Gastos Fijos
              </button>
            </div>
          </div>

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
                        <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">Nombre</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">Recargo/Descuento</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metodosPago.map((metodo) => (
                        <tr key={metodo.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                          <td className="px-6 py-4 font-medium">{metodo.nombre}</td>
                          <td className="px-6 py-4">
                            <span
                              className={
                                metodo.recargo > 0
                                  ? 'text-red-500'
                                  : metodo.recargo < 0
                                  ? 'text-green-500'
                                  : 'text-zinc-400'
                              }
                            >
                              {metodo.recargo > 0 ? '+' : ''}
                              {metodo.recargo}%
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
                                onClick={() => solicitarEliminar('metodo', metodo)}
                                className="p-2 hover:bg-red-600/20 rounded-lg transition-colors text-zinc-400 hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {metodosPago.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-6 py-12 text-center text-zinc-500">
                            No hay métodos de pago. Creá uno con "Nuevo Método".
                          </td>
                        </tr>
                      )}
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
                        <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">Nombre</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categorias.map((categoria) => (
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
                                onClick={() => solicitarEliminar('categoria', categoria)}
                                className="p-2 hover:bg-red-600/20 rounded-lg transition-colors text-zinc-400 hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {categorias.length === 0 && (
                        <tr>
                          <td colSpan={2} className="px-6 py-12 text-center text-zinc-500">
                            No hay categorías. Creá una con "Nueva Categoría".
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {seccionActiva === 'gastos-fijos' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Gastos Fijos del Mes</h2>
                  <button
                    onClick={handleAgregarGastoFijo}
                    className="bg-red-600 hover:bg-red-700 transition-colors px-6 py-3 rounded-lg flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Nuevo Gasto Fijo
                  </button>
                </div>

                <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">Nombre / Concepto</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">Monto Mensual</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gastosFijos.map((gasto) => (
                        <tr key={gasto.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                          <td className="px-6 py-4 font-medium">{gasto.nombre}</td>
                          <td className="px-6 py-4 text-red-500 font-medium">${gasto.monto.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleEditarGastoFijo(gasto)} className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => solicitarEliminar('gasto', gasto)} className="p-2 hover:bg-red-600/20 rounded-lg transition-colors text-zinc-400 hover:text-red-500">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {gastosFijos.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-6 py-12 text-center text-zinc-500">
                            No hay gastos fijos. Creá uno con "Nuevo Gasto Fijo".
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ModalMetodoPago
        isOpen={showMetodoPagoModal}
        onClose={() => {
          setShowMetodoPagoModal(false);
          setMetodoPagoEditando(null);
        }}
        onGuardar={handleGuardarMetodoPago}
        metodoEditando={metodoPagoEditando}
        guardando={guardando}
      />

      <ModalCategoria
        isOpen={showCategoriaModal}
        onClose={() => {
          setShowCategoriaModal(false);
          setCategoriaEditando(null);
        }}
        onGuardar={handleGuardarCategoria}
        categoriaEditando={categoriaEditando}
        guardando={guardando}
      />

      <ModalGastoFijo
        isOpen={showGastoFijoModal}
        onClose={() => {
          setShowGastoFijoModal(false);
          setGastoFijoEditando(null);
        }}
        onGuardar={handleGuardarGastoFijo}
        gastoEditando={gastoFijoEditando}
      />

      <ConfirmarEliminacionModal
        isOpen={!!eliminarPendiente}
        onClose={() => setEliminarPendiente(null)}
        onConfirmar={confirmarEliminacion}
        titulo={eliminarPendiente ? ELIMINAR_CONFIG[eliminarPendiente.tipo].titulo : ''}
        mensaje={eliminarPendiente ? ELIMINAR_CONFIG[eliminarPendiente.tipo].mensaje : ''}
        nombreEntidad={eliminarPendiente?.nombre}
      />
    </>
  );
}

function ModalMetodoPago({ isOpen, onClose, onGuardar, metodoEditando, guardando }) {
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

  const handleSubmit = (e) => {
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
            <label className="block text-xs text-zinc-400 mb-2 uppercase tracking-wide">Nombre del Método</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600 border border-zinc-700"
              placeholder="Ej: Tarjeta Débito"
              autoFocus
              disabled={guardando}
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-2 uppercase tracking-wide">Recargo/Descuento (%)</label>
            <input
              type="number"
              value={recargo}
              onChange={(e) => setRecargo(e.target.value)}
              className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600 border border-zinc-700"
              placeholder="0"
              step="0.01"
              disabled={guardando}
            />
            <p className="text-xs text-zinc-500 mt-2">Positivo para recargo, negativo para descuento</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
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
              {guardando ? 'Guardando...' : metodoEditando ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalGastoFijo({ isOpen, onClose, onGuardar, gastoEditando }) {
  const [nombre, setNombre] = useState('');
  const [monto, setMonto] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (gastoEditando) {
        setNombre(gastoEditando.nombre);
        setMonto(gastoEditando.monto.toString());
      } else {
        setNombre('');
        setMonto('');
      }
    }
  }, [isOpen, gastoEditando]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim() || !monto) {
      alert('Por favor ingresa un nombre y un monto válidos');
      return;
    }
    onGuardar(nombre.trim(), parseFloat(monto));
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-lg w-full max-w-md">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold">{gastoEditando ? 'Editar Gasto Fijo' : 'Nuevo Gasto Fijo'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs text-zinc-400 mb-2 uppercase tracking-wide">Concepto</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600 border border-zinc-700"
              placeholder="Ej: Luz, Alquiler..."
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-2 uppercase tracking-wide">Monto Estimado / Fijo ($)</label>
            <input
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600 border border-zinc-700"
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button type="button" onClick={onClose} className="bg-zinc-800 hover:bg-zinc-700 transition-colors rounded-lg py-3 font-medium">Cancelar</button>
            <button type="submit" className="bg-red-600 hover:bg-red-700 transition-colors rounded-lg py-3 font-medium">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalCategoria({ isOpen, onClose, onGuardar, categoriaEditando, guardando }) {
  const [nombre, setNombre] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNombre(categoriaEditando ? categoriaEditando.nombre : '');
    }
  }, [isOpen, categoriaEditando]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
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
            <label className="block text-xs text-zinc-400 mb-2 uppercase tracking-wide">Nombre de la Categoría</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600 border border-zinc-700"
              placeholder="Ej: Bebidas"
              autoFocus
              disabled={guardando}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
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
              {guardando ? 'Guardando...' : categoriaEditando ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
