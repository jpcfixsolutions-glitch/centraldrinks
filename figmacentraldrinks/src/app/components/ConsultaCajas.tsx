import { useState } from 'react';
import { ArrowLeft, Calendar, Eye, DollarSign, Receipt } from 'lucide-react';

interface CierreCaja {
  id: number;
  fecha: Date;
  caja: string;
  empleado: string;
  cantidadVentas: number;
  ingresoTotal: number;
  ventas: Venta[];
}

interface Venta {
  id: string;
  hora: string;
  metodoPago: string;
  total: number;
  productos: ProductoVenta[];
  tipo: 'mostrador' | 'mesa';
  numeroMesa?: number;
}

interface ProductoVenta {
  nombre: string;
  cantidad: number;
  precio: number;
}

interface ConsultaCajasProps {
  onVolver: () => void;
  ventasCaja: Venta[];
}

export function ConsultaCajas({ onVolver, ventasCaja }: ConsultaCajasProps) {
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [empleadoFiltro, setEmpleadoFiltro] = useState('todos');
  const [cajaSeleccionada, setCajaSeleccionada] = useState<CierreCaja | null>(null);

  // Agregar ventas de ejemplo + ventas reales
  const ventasEjemplo: Venta[] = [
    {
      id: 'HLOE6I66Q',
      hora: '05:19:10',
      metodoPago: 'Efectivo',
      total: 30000,
      tipo: 'mostrador',
      productos: [
        { nombre: 'Promo Absolut + 2 Speed XL', cantidad: 1, precio: 30000 }
      ]
    },
    {
      id: 'ABCD1234X',
      hora: '14:22:15',
      metodoPago: 'Transferencia',
      total: 122000,
      tipo: 'mostrador',
      productos: [
        { nombre: 'Vino Santa Julia', cantidad: 2, precio: 11000 },
        { nombre: 'Promo fernet + coca de 2l retornable', cantidad: 5, precio: 20000 }
      ]
    }
  ];

  const todasLasVentas = [...ventasEjemplo, ...ventasCaja];

  // Datos de ejemplo
  const cierresRaw: CierreCaja[] = [
    {
      id: 1,
      fecha: new Date('2026-05-05T16:15:41'),
      caja: 'Caja 01',
      empleado: 'Empleado #1',
      cantidadVentas: 0, // Se calculará
      ingresoTotal: 0, // Se calculará
      ventas: todasLasVentas
    },
    {
      id: 2,
      fecha: new Date('2026-05-05T14:15:03'),
      caja: 'Caja 01',
      empleado: 'Empleado #1',
      cantidadVentas: 0,
      ingresoTotal: 0,
      ventas: []
    }
  ];

  // Calcular totales reales
  const [cierres] = useState<CierreCaja[]>(
    cierresRaw.map(cierre => ({
      ...cierre,
      cantidadVentas: cierre.ventas.length,
      ingresoTotal: cierre.ventas.reduce((sum, venta) => sum + venta.total, 0)
    }))
  );

  const empleadosDisponibles = ['todos', ...Array.from(new Set(cierres.map(c => c.empleado)))];

  const cierresFiltrados = cierres.filter(cierre => {
    const fechaMatch = fechaFiltro
      ? new Date(cierre.fecha).toISOString().split('T')[0] === fechaFiltro
      : true;
    const empleadoMatch = empleadoFiltro === 'todos' || cierre.empleado === empleadoFiltro;
    return fechaMatch && empleadoMatch;
  });

  const totalCajasCerradas = cierresFiltrados.length;
  const ingresosTotales = cierresFiltrados.reduce((sum, cierre) => sum + cierre.ingresoTotal, 0);

  const formatearFechaHora = (fecha: Date) => {
    return new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
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
              <h1 className="text-2xl font-bold">Consulta de Cajas</h1>
              <p className="text-sm text-zinc-500 mt-1">Historial de cierres de caja por día</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-8 overflow-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-blue-500" />
                </div>
                <p className="text-zinc-400 text-sm">Cajas Cerradas</p>
              </div>
              <p className="text-4xl font-bold">{totalCajasCerradas}</p>
            </div>

            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-500" />
                </div>
                <p className="text-zinc-400 text-sm">Ingresos Totales (Histórico)</p>
              </div>
              <p className="text-4xl font-bold text-green-500">${ingresosTotales.toLocaleString()}</p>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6 mb-6">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">Filtros</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Fecha</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <input
                    type="date"
                    value={fechaFiltro}
                    onChange={(e) => setFechaFiltro(e.target.value)}
                    placeholder="dd/mm/aaaa"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Empleado</label>
                <select
                  value={empleadoFiltro}
                  onChange={(e) => setEmpleadoFiltro(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  {empleadosDisponibles.map(emp => (
                    <option key={emp} value={emp}>
                      {emp === 'todos' ? 'Todos los empleados' : emp}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">
                      Fecha y Hora
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">
                      Caja
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">
                      Empleado
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">
                      Cant. Ventas
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">
                      Ingreso Total
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400 uppercase tracking-wide">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cierresFiltrados.map(cierre => (
                    <tr key={cierre.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4 text-zinc-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {formatearFechaHora(cierre.fecha)}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">{cierre.caja}</td>
                      <td className="px-6 py-4 text-blue-500">{cierre.empleado}</td>
                      <td className="px-6 py-4">{cierre.cantidadVentas}</td>
                      <td className="px-6 py-4 text-green-500 font-medium">
                        ${cierre.ingresoTotal.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setCajaSeleccionada(cierre)}
                          className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {cierresFiltrados.length === 0 && (
                <div className="text-center py-12 text-zinc-500">
                  No hay cierres de caja para mostrar
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Detalle de Caja */}
      {cajaSeleccionada && (
        <DetalleCajaModal
          cierre={cajaSeleccionada}
          onClose={() => setCajaSeleccionada(null)}
        />
      )}
    </>
  );
}

// Modal de Detalle
interface DetalleCajaModalProps {
  cierre: CierreCaja;
  onClose: () => void;
}

function DetalleCajaModal({ cierre, onClose }: DetalleCajaModalProps) {
  const [tipoVista, setTipoVista] = useState<'mostrador' | 'mesa'>('mostrador');

  const formatearFecha = (fecha: Date) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatearHora = (fecha: Date) => {
    return new Date(fecha).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Filtrar ventas según el tipo
  const ventasFiltradas = cierre.ventas.filter(v => v.tipo === tipoVista);

  // Calcular resumen de productos para mostrador
  const resumenProductosMostrador = cierre.ventas
    .filter(v => v.tipo === 'mostrador')
    .reduce((acc, venta) => {
      venta.productos.forEach(producto => {
        const key = producto.nombre;
        if (!acc[key]) {
          acc[key] = { nombre: producto.nombre, cantidad: 0, recaudacion: 0 };
        }
        acc[key].cantidad += producto.cantidad;
        acc[key].recaudacion += producto.cantidad * producto.precio;
      });
      return acc;
    }, {} as Record<string, { nombre: string; cantidad: number; recaudacion: number }>);

  // Calcular resumen de productos para mesas (con número de mesa)
  const resumenProductosMesas = cierre.ventas
    .filter(v => v.tipo === 'mesa')
    .flatMap(venta =>
      venta.productos.map(producto => ({
        nombre: producto.nombre,
        cantidad: producto.cantidad,
        recaudacion: producto.cantidad * producto.precio,
        mesa: venta.numeroMesa || 0
      }))
    );

  const productosArrayMostrador = Object.values(resumenProductosMostrador);
  const totalMostrador = productosArrayMostrador.reduce((sum, p) => sum + p.recaudacion, 0);
  const totalMesas = resumenProductosMesas.reduce((sum, p) => sum + p.recaudacion, 0);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Detalle de Caja: {cierre.caja}</h2>
              <div className="flex items-center gap-4 text-sm text-zinc-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatearFecha(cierre.fecha)} - {formatearHora(cierre.fecha)}
                </div>
                <span>•</span>
                <span>Atendió: {cierre.empleado}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <span className="text-2xl text-zinc-400">×</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-sm text-zinc-400">Total Tickets</p>
              </div>
              <p className="text-3xl font-bold">{cierre.ventas.length}</p>
            </div>

            <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-sm text-zinc-400">Ingreso Total</p>
              </div>
              <p className="text-3xl font-bold text-green-500">
                ${cierre.ventas.reduce((sum, v) => sum + v.total, 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Switch Mostrador/Mesas */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span className="text-zinc-400">📋</span>
              Resumen de Productos Vendidos en {tipoVista === 'mostrador' ? 'Mostrador' : 'Mesas'}
            </h3>
            <div className="flex items-center gap-2 bg-zinc-800 p-1 rounded-lg border border-zinc-700">
              <button
                onClick={() => setTipoVista('mostrador')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  tipoVista === 'mostrador'
                    ? 'bg-red-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Mostrador
              </button>
              <button
                onClick={() => setTipoVista('mesa')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  tipoVista === 'mesa'
                    ? 'bg-red-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Mesas
              </button>
            </div>
          </div>

          {/* Resumen de Productos - Mostrador */}
          {tipoVista === 'mostrador' && productosArrayMostrador.length > 0 && (
            <div className="mb-6">
              <div className="bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-700">
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Producto</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Cant.</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Recaudación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosArrayMostrador.map((producto, idx) => (
                      <tr key={idx} className="border-b border-zinc-700/50 last:border-0">
                        <td className="px-4 py-3">{producto.nombre}</td>
                        <td className="px-4 py-3">{producto.cantidad}</td>
                        <td className="px-4 py-3 font-medium">${producto.recaudacion.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="bg-zinc-700/30 font-bold">
                      <td className="px-4 py-3" colSpan={2}>TOTAL</td>
                      <td className="px-4 py-3 text-green-500">${totalMostrador.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Resumen de Productos - Mesas */}
          {tipoVista === 'mesa' && resumenProductosMesas.length > 0 && (
            <div className="mb-6">
              <div className="bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-700">
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Producto</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Mesa</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Cant.</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Recaudación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumenProductosMesas.map((producto, idx) => (
                      <tr key={idx} className="border-b border-zinc-700/50 last:border-0">
                        <td className="px-4 py-3">{producto.nombre}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-blue-600/20 text-blue-500 rounded text-xs font-medium">
                            Mesa {producto.mesa}
                          </span>
                        </td>
                        <td className="px-4 py-3">{producto.cantidad}</td>
                        <td className="px-4 py-3 font-medium">${producto.recaudacion.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="bg-zinc-700/30 font-bold">
                      <td className="px-4 py-3" colSpan={3}>TOTAL</td>
                      <td className="px-4 py-3 text-green-500">${totalMesas.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Mensaje si no hay datos */}
          {((tipoVista === 'mostrador' && productosArrayMostrador.length === 0) ||
            (tipoVista === 'mesa' && resumenProductosMesas.length === 0)) && (
            <div className="mb-6 bg-zinc-800 rounded-lg border border-zinc-700 p-8 text-center text-zinc-500">
              No hay ventas en {tipoVista === 'mostrador' ? 'mostrador' : 'mesas'} para este cierre
            </div>
          )}

          {/* Detalle por Ticket */}
          {ventasFiltradas.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="text-zinc-400">🎫</span>
                Detalle por Ticket
              </h3>
              <div className="space-y-4">
                {ventasFiltradas.map(venta => (
                  <div key={venta.id} className="bg-zinc-800 rounded-lg border border-zinc-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <span className="text-blue-500 font-bold">#{venta.id}</span>
                        <span className="text-sm text-zinc-400">{venta.hora}</span>
                        {venta.tipo === 'mesa' && venta.numeroMesa && (
                          <span className="px-2 py-1 bg-blue-600/20 text-blue-500 rounded text-xs font-medium">
                            Mesa {venta.numeroMesa}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">${venta.total.toLocaleString()}</p>
                        <p className="text-sm text-zinc-400 uppercase">{venta.metodoPago}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {venta.productos.map((producto, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-zinc-300">{producto.cantidad}x {producto.nombre}</span>
                          <span className="text-zinc-400">${(producto.cantidad * producto.precio).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="w-full md:w-auto px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
