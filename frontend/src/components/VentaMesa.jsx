import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { ArrowLeft, Plus, Printer, Trash2, Minus, XCircle, Pencil, Check, X, ScanBarcode } from 'lucide-react';
import { AgregarProductoMesaModal } from './AgregarProductoMesaModal.jsx';
import { CobroDivididoModal } from './CobroDivididoModal.jsx';
import { TicketCobro, imprimirTicket } from './TicketCobro.jsx';
import { ConfirmarImprimirTicketModal } from './ConfirmarImprimirTicketModal.jsx';
import { useImprimirVentaTicket } from '../hooks/useImprimirVentaTicket.jsx';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner.js';
import { validarCantidadStock, validarCarritoStock, stockDisponible } from '../lib/stock.js';
import { productoPorCodBarra } from '../lib/productos.js';

export function VentaMesa({
  numeroMesa,
  onVolver,
  onConfirmarVenta,
  metodosPago,
  productos,
  cargaInicial,
  onActualizarCarga,
  nombreMesa = '',
  onActualizarNombre,
}) {
  const [carrito, setCarrito] = useState(cargaInicial || []);
  const [showAgregarModal, setShowAgregarModal] = useState(false);
  const [showCerrarMesaModal, setShowCerrarMesaModal] = useState(false);
  const [ventaRecienRegistrada, setVentaRecienRegistrada] = useState(null);
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nombreEditado, setNombreEditado] = useState(nombreMesa);
  const inputNombreRef = useRef(null);
  const ticketPreCobroRef = useRef(null);
  const { imprimirVenta, TicketOculto } = useImprimirVentaTicket(metodosPago);

  const handleIniciarEdicionNombre = () => {
    setNombreEditado(nombreMesa);
    setEditandoNombre(true);
    setTimeout(() => inputNombreRef.current?.focus(), 0);
  };

  const handleGuardarNombre = () => {
    onActualizarNombre?.(numeroMesa, nombreEditado.trim());
    setEditandoNombre(false);
  };

  const handleCancelarNombre = () => {
    setEditandoNombre(false);
  };

  const handleKeyDownNombre = (e) => {
    if (e.key === 'Enter') handleGuardarNombre();
    if (e.key === 'Escape') handleCancelarNombre();
  };

  useEffect(() => {
    onActualizarCarga(numeroMesa, carrito);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carrito, numeroMesa]);

  const totalMesa = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  const cantidadesCarrito = useMemo(
    () => Object.fromEntries(carrito.map((item) => [item.id, item.cantidad])),
    [carrito]
  );

  const agregarProducto = (producto) => {
    const productoActual = productos.find((p) => p.id === producto.id);
    const cantidadEnCarrito = cantidadesCarrito[producto.id] ?? 0;
    const validacion = validarCantidadStock(productoActual, cantidadEnCarrito + 1);
    if (!validacion.ok) {
      alert(validacion.mensaje);
      return;
    }

    setCarrito((prev) => {
      const existente = prev.find((p) => p.id === producto.id);
      if (existente) {
        return prev.map((p) => (p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p));
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const handleScanCodBarra = useCallback(
    (codigo) => {
      const producto = productoPorCodBarra(productos, codigo);
      if (!producto) {
        alert(`No se encontró producto con código ${codigo}`);
        return;
      }
      agregarProducto({
        id: producto.id,
        nombre: producto.nombre,
        categoria: producto.categoria || 'Sin categoría',
        precio: producto.precioMesa,
        imagen: producto.imagen,
      });
    },
    [productos, cantidadesCarrito]
  );

  useBarcodeScanner({
    enabled: !showAgregarModal && !showCerrarMesaModal && !ventaRecienRegistrada && !editandoNombre,
    onScan: handleScanCodBarra,
  });

  const aumentarCantidad = (id) => {
    const productoActual = productos.find((p) => p.id === id);
    const itemCarrito = carrito.find((p) => p.id === id);
    const validacion = validarCantidadStock(productoActual, (itemCarrito?.cantidad ?? 0) + 1);
    if (!validacion.ok) {
      alert(validacion.mensaje);
      return;
    }

    setCarrito((prev) => prev.map((p) => (p.id === id ? { ...p, cantidad: p.cantidad + 1 } : p)));
  };

  const disminuirCantidad = (id) => {
    setCarrito((prev) => {
      const producto = prev.find((p) => p.id === id);
      if (producto && producto.cantidad > 1) {
        return prev.map((p) => (p.id === id ? { ...p, cantidad: p.cantidad - 1 } : p));
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  const eliminarProducto = (id) => {
    setCarrito((prev) => prev.filter((p) => p.id !== id));
  };

  const handleCerrarMesa = () => {
    if (carrito.length === 0) {
      alert('No hay productos para cobrar');
      return;
    }
    setShowCerrarMesaModal(true);
  };

  const handleConfirmarCerrarMesa = async ({
    descuento,
    pagos,
    metodoPagoPrincipal,
    totalACobrar,
    clienteId,
  }) => {
    const validacionCarrito = validarCarritoStock(productos, carrito);
    if (!validacionCarrito.ok) {
      alert(validacionCarrito.mensaje);
      return;
    }

    const venta = {
      tipo: 'mesa',
      numeroMesa,
      total: totalACobrar,
      descuento,
      metodoPago: metodoPagoPrincipal || 'Efectivo',
      items: carrito.map((p) => ({
        productoId: p.id,
        nombreProducto: p.nombre,
        precio: p.precio,
        cantidad: p.cantidad,
      })),
      pagos,
      ...(clienteId ? { clienteId } : {}),
    };
    const creada = await onConfirmarVenta(numeroMesa, venta);
    setShowCerrarMesaModal(false);
    setVentaRecienRegistrada({
      venta: {
        ...venta,
        codigo: creada?.codigo,
        fecha: creada?.fecha ?? new Date().toISOString(),
        pagos: pagos.map((p) => ({ metodoPago: p.metodoPago, monto: p.monto, recargo: p.recargo })),
      },
      codigo: creada?.codigo,
      total: totalACobrar,
    });
  };

  const handleImprimirPreCobro = () => {
    imprimirTicket(ticketPreCobroRef.current);
  };

  return (
    <>
      <div className="flex-1 flex flex-col bg-black text-white">
        <header className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 border-b border-zinc-800 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <button onClick={onVolver} className="hover:bg-zinc-800 p-2 rounded-lg transition-colors shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold">Mesa {numeroMesa}</h1>
                {!editandoNombre && nombreMesa && (
                  <span className="text-xl sm:text-2xl font-bold text-red-400">— {nombreMesa}</span>
                )}
                {!editandoNombre && (
                  <button
                    onClick={handleIniciarEdicionNombre}
                    className="p-1 hover:bg-zinc-700 rounded transition-colors text-zinc-500 hover:text-white"
                    title={nombreMesa ? 'Editar nombre' : 'Agregar nombre'}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-sm text-zinc-500 flex items-center gap-1.5 mt-1">
                <ScanBarcode className="w-4 h-4" />
                Escaneá código de barras para agregar productos
              </p>
              {editandoNombre && (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    ref={inputNombreRef}
                    value={nombreEditado}
                    onChange={(e) => setNombreEditado(e.target.value)}
                    onKeyDown={handleKeyDownNombre}
                    placeholder="Nombre del cliente (ej: Pepito)"
                    maxLength={20}
                    className="bg-zinc-800 border border-zinc-600 focus:border-red-500 rounded px-3 py-1.5 text-sm text-white focus:outline-none w-48"
                  />
                  <button
                    onClick={handleGuardarNombre}
                    className="p-1.5 bg-green-600/20 hover:bg-green-600/30 rounded text-green-400"
                    title="Guardar"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleCancelarNombre}
                    className="p-1.5 bg-zinc-700 hover:bg-zinc-600 rounded text-zinc-400"
                    title="Cancelar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowAgregarModal(true)}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 transition-colors px-4 sm:px-6 py-3 rounded-lg flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Agregar Item
          </button>
        </header>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 p-4 sm:p-6 lg:p-8">
          <div className="lg:col-span-2 bg-zinc-900 rounded-lg border border-zinc-800 p-6">
            {carrito.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-500">Mesa vacía</div>
            ) : (
              <div className="space-y-3">
                {carrito.map((producto) => {
                  const productoActual = productos.find((p) => p.id === producto.id);
                  const alMaximoStock =
                    (productoActual ? stockDisponible(productoActual) : 0) <= producto.cantidad;

                  return (
                  <div key={producto.id} className="bg-zinc-800 rounded-lg p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{producto.nombre}</p>
                      <p className="text-sm text-zinc-400">{producto.categoria}</p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto">
                      <div className="flex items-center gap-2 bg-zinc-700 rounded-lg shrink-0">
                        <button
                          onClick={() => disminuirCantidad(producto.id)}
                          className="p-2 hover:bg-zinc-600 rounded-l-lg transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-3 min-w-[2rem] text-center">{producto.cantidad}</span>
                        <button
                          onClick={() => aumentarCantidad(producto.id)}
                          disabled={alMaximoStock}
                          className="p-2 hover:bg-zinc-600 rounded-r-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-red-500 font-medium w-24 text-right">
                        ${(producto.precio * producto.cantidad).toLocaleString()}
                      </p>
                      <button
                        onClick={() => eliminarProducto(producto.id)}
                        className="p-2 hover:bg-red-600/20 rounded-lg transition-colors text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
              <p className="text-zinc-400 text-sm mb-2">Total Mesa</p>
              <p className="text-3xl sm:text-4xl font-bold text-red-500">${totalMesa.toLocaleString()}</p>
            </div>

            <button
              onClick={handleImprimirPreCobro}
              disabled={carrito.length === 0}
              className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg p-4 flex items-center justify-center gap-2"
            >
              <Printer className="w-5 h-5" />
              Imprimir Ticket
            </button>

            <button
              onClick={handleCerrarMesa}
              disabled={carrito.length === 0}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg p-4 flex items-center justify-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              Cerrar Mesa / Cobrar
            </button>
          </div>
        </div>
      </div>

      <AgregarProductoMesaModal
        isOpen={showAgregarModal}
        onClose={() => setShowAgregarModal(false)}
        onAgregar={agregarProducto}
        productos={productos}
        cantidadesCarrito={cantidadesCarrito}
      />

      {showCerrarMesaModal && (
        <CobroDivididoModal
          isOpen={showCerrarMesaModal}
          onClose={() => setShowCerrarMesaModal(false)}
          totalVenta={totalMesa}
          onConfirmar={handleConfirmarCerrarMesa}
          metodosPago={metodosPago}
          items={carrito}
          tipo="mesa"
          numeroMesa={numeroMesa}
        />
      )}

      <ConfirmarImprimirTicketModal
        isOpen={!!ventaRecienRegistrada}
        onClose={() => setVentaRecienRegistrada(null)}
        onImprimir={() => ventaRecienRegistrada && imprimirVenta(ventaRecienRegistrada.venta)}
        codigo={ventaRecienRegistrada?.codigo}
        total={ventaRecienRegistrada?.total}
      />

      <div className="hidden" aria-hidden="true">
        <div ref={ticketPreCobroRef}>
          <TicketCobro
            items={carrito.map((p) => ({
              nombre: p.nombre,
              precio: p.precio,
              cantidad: p.cantidad,
            }))}
            tipo="mesa"
            numeroMesa={numeroMesa}
          />
        </div>
      </div>

      <TicketOculto />
    </>
  );
}
