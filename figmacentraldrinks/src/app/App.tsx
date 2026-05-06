import { useState, useCallback } from 'react';
import { Home, ShoppingCart, Package, BarChart3, Receipt, Utensils, Settings, LogOut } from 'lucide-react';
import { VentaMostrador } from './components/VentaMostrador';
import { GestionStock } from './components/GestionStock';
import { VentaMesa } from './components/VentaMesa';
import { GestionMesas } from './components/GestionMesas';
import { Configuracion } from './components/Configuracion';
import { ConsultaCajas } from './components/ConsultaCajas';
import { Login } from './components/Login';

interface MesaCerrada {
  id: number;
  numeroMesa: number;
  fecha: Date;
  total: number;
}

interface MetodoPago {
  id: number;
  nombre: string;
  recargo: number;
}

interface CategoriaProducto {
  id: number;
  nombre: string;
}

interface ProductoMesa {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  categoria: string;
}

interface EstadoMesa {
  numeroMesa: number;
  productos: ProductoMesa[];
  totalAcumulado: number;
}

interface CierreCaja {
  id: string;
  hora: string;
  metodoPago: string;
  total: number;
  tipo: 'mostrador' | 'mesa';
  numeroMesa?: number;
  productos: { nombre: string; cantidad: number; precio: number }[];
}

interface Usuario {
  username: string;
  password: string;
  rol: 'administrador' | 'empleado';
  nombre: string;
}

type Vista = 'home' | 'ventas' | 'stock' | 'mesas' | 'cajas' | 'configuracion';

export default function App() {
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(null);
  const [vistaActual, setVistaActual] = useState<Vista>('home');
  const [mesaSeleccionada, setMesaSeleccionada] = useState<number | null>(null);
  const [mesasCerradas, setMesasCerradas] = useState<MesaCerrada[]>([]);
  const [estadoMesas, setEstadoMesas] = useState<Record<number, EstadoMesa>>({});
  const [ventasCaja, setVentasCaja] = useState<CierreCaja[]>([]);

  // Configuración del sistema
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([
    { id: 1, nombre: 'Efectivo', recargo: 0 },
    { id: 2, nombre: 'Transferencia', recargo: 0 },
    { id: 3, nombre: 'Tarjeta Débito', recargo: 5 },
    { id: 4, nombre: 'Tarjeta Crédito', recargo: 10 },
  ]);

  const [categorias, setCategorias] = useState<CategoriaProducto[]>([
    { id: 1, nombre: 'Vinos' },
    { id: 2, nombre: 'Tapas' },
    { id: 3, nombre: 'Cervezas' },
    { id: 4, nombre: 'Promociones' },
  ]);

  const handleCerrarMesa = useCallback((numeroMesa: number, total: number, ventaCaja: CierreCaja) => {
    // Registrar mesa cerrada
    const nuevaMesaCerrada: MesaCerrada = {
      id: mesasCerradas.length + 1,
      numeroMesa,
      fecha: new Date(),
      total
    };
    setMesasCerradas(prev => [nuevaMesaCerrada, ...prev]);

    // Registrar venta en caja
    setVentasCaja(prev => [...prev, ventaCaja]);

    // Limpiar estado de la mesa
    setEstadoMesas(prev => {
      const nuevo = { ...prev };
      delete nuevo[numeroMesa];
      return nuevo;
    });

    setMesaSeleccionada(null);
  }, [mesasCerradas.length]);

  const handleActualizarEstadoMesa = useCallback((numeroMesa: number, productos: ProductoMesa[], totalAcumulado: number) => {
    setEstadoMesas(prev => ({
      ...prev,
      [numeroMesa]: {
        numeroMesa,
        productos,
        totalAcumulado
      }
    }));
  }, []);

  const handleAbrirMesa = (numeroMesa: number) => {
    setMesaSeleccionada(numeroMesa);
  };

  const handleLogin = (usuario: Usuario) => {
    setUsuarioActual(usuario);
    setVistaActual('home');
  };

  const handleLogout = () => {
    setUsuarioActual(null);
    setVistaActual('home');
    setMesaSeleccionada(null);
  };

  // Si no hay usuario autenticado, mostrar login
  if (!usuarioActual) {
    return <Login onLogin={handleLogin} />;
  }

  // Verificar permisos según rol
  const esAdministrador = usuarioActual.rol === 'administrador';
  const puedeAccederStock = esAdministrador;
  const puedeAccederCajas = esAdministrador;
  const puedeAccederConfiguracion = esAdministrador;

  const currentDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const currentTime = new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  if (vistaActual === 'ventas') {
    return (
      <div className="min-h-screen bg-black text-white flex">
        {/* Sidebar */}
        <div className="w-16 bg-zinc-900 flex flex-col items-center py-6 space-y-8">
          <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center text-sm font-bold">
            CD
          </div>

          <div className="flex-1 flex flex-col items-center space-y-6">
            <button
              onClick={() => setVistaActual('home')}
              className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
            >
              <Home className="w-5 h-5" />
            </button>
            <button className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center hover:bg-red-700 transition-colors">
              <ShoppingCart className="w-5 h-5" />
            </button>
            {puedeAccederStock && (
              <button
                onClick={() => setVistaActual('stock')}
                className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
              >
                <Package className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setVistaActual('mesas')}
              className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
            >
              <Utensils className="w-5 h-5" />
            </button>
            {puedeAccederCajas && (
              <button
                onClick={() => setVistaActual('cajas')}
                className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
              >
                <BarChart3 className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex flex-col items-center gap-4 pb-6">
            {puedeAccederConfiguracion && (
              <button
                onClick={() => setVistaActual('configuracion')}
                className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={handleLogout}
              className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-red-600 transition-colors text-zinc-400 hover:text-white"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        <VentaMostrador
          onVolver={() => setVistaActual('home')}
          metodosPago={metodosPago}
        />
      </div>
    );
  }

  // Redirigir si intenta acceder a vista sin permisos
  if (vistaActual === 'stock' && !puedeAccederStock) {
    setVistaActual('home');
  }
  if (vistaActual === 'cajas' && !puedeAccederCajas) {
    setVistaActual('home');
  }
  if (vistaActual === 'configuracion' && !puedeAccederConfiguracion) {
    setVistaActual('home');
  }

  if (vistaActual === 'stock') {
    return (
      <div className="min-h-screen bg-black text-white flex">
        {/* Sidebar */}
        <div className="w-16 bg-zinc-900 flex flex-col items-center py-6 space-y-8">
          <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center text-sm font-bold">
            CD
          </div>

          <div className="flex-1 flex flex-col items-center space-y-6">
            <button
              onClick={() => setVistaActual('home')}
              className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
            >
              <Home className="w-5 h-5" />
            </button>
            <button
              onClick={() => setVistaActual('ventas')}
              className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
            </button>
            {puedeAccederStock && (
              <button className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center hover:bg-red-700 transition-colors">
                <Package className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setVistaActual('mesas')}
              className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
            >
              <Utensils className="w-5 h-5" />
            </button>
            {puedeAccederCajas && (
              <button
                onClick={() => setVistaActual('cajas')}
                className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
              >
                <BarChart3 className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex flex-col items-center gap-4 pb-6">
            {puedeAccederConfiguracion && (
              <button
                onClick={() => setVistaActual('configuracion')}
                className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={handleLogout}
              className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-red-600 transition-colors text-zinc-400 hover:text-white"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        <GestionStock
          onVolver={() => setVistaActual('home')}
          categorias={categorias}
        />
      </div>
    );
  }

  if (vistaActual === 'mesas') {
    if (mesaSeleccionada !== null) {
      return (
        <div className="min-h-screen bg-black text-white flex">
          {/* Sidebar */}
          <div className="w-16 bg-zinc-900 flex flex-col items-center py-6 space-y-8">
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center text-sm font-bold">
              CD
            </div>

            <div className="flex-1 flex flex-col items-center space-y-6">
              <button
                onClick={() => setVistaActual('home')}
                className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
              >
                <Home className="w-5 h-5" />
              </button>
              <button
                onClick={() => setVistaActual('ventas')}
                className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
              </button>
              {puedeAccederStock && (
                <button
                  onClick={() => setVistaActual('stock')}
                  className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
                >
                  <Package className="w-5 h-5" />
                </button>
              )}
              <button className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center hover:bg-red-700 transition-colors">
                <Utensils className="w-5 h-5" />
              </button>
              {puedeAccederCajas && (
                <button
                  onClick={() => setVistaActual('cajas')}
                  className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
                >
                  <BarChart3 className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="flex flex-col items-center gap-4 pb-6">
              {puedeAccederConfiguracion && (
                <button
                  onClick={() => setVistaActual('configuracion')}
                  className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={handleLogout}
                className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-red-600 transition-colors text-zinc-400 hover:text-white"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          <VentaMesa
            numeroMesa={mesaSeleccionada}
            onVolver={() => setMesaSeleccionada(null)}
            onCerrarMesa={handleCerrarMesa}
            metodosPago={metodosPago}
            estadoMesa={estadoMesas[mesaSeleccionada] || null}
            onActualizarEstado={handleActualizarEstadoMesa}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-black text-white flex">
        {/* Sidebar */}
        <div className="w-16 bg-zinc-900 flex flex-col items-center py-6 space-y-8">
          <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center text-sm font-bold">
            CD
          </div>

          <div className="flex-1 flex flex-col items-center space-y-6">
            <button
              onClick={() => setVistaActual('home')}
              className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
            >
              <Home className="w-5 h-5" />
            </button>
            <button
              onClick={() => setVistaActual('ventas')}
              className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
            </button>
            {puedeAccederStock && (
              <button
                onClick={() => setVistaActual('stock')}
                className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
              >
                <Package className="w-5 h-5" />
              </button>
            )}
            <button className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center hover:bg-red-700 transition-colors">
              <Utensils className="w-5 h-5" />
            </button>
            {puedeAccederCajas && (
              <button
                onClick={() => setVistaActual('cajas')}
                className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
              >
                <BarChart3 className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex flex-col items-center gap-4 pb-6">
            {puedeAccederConfiguracion && (
              <button
                onClick={() => setVistaActual('configuracion')}
                className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={handleLogout}
              className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-red-600 transition-colors text-zinc-400 hover:text-white"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        <GestionMesas
          onVolver={() => setVistaActual('home')}
          onAbrirMesa={handleAbrirMesa}
          mesasCerradas={mesasCerradas}
          estadoMesas={estadoMesas}
          esAdministrador={esAdministrador}
        />
      </div>
    );
  }

  if (vistaActual === 'configuracion') {
    return (
      <div className="min-h-screen bg-black text-white flex">
        {/* Sidebar */}
        <div className="w-16 bg-zinc-900 flex flex-col items-center py-6 space-y-8">
          <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center text-sm font-bold">
            CD
          </div>

          <div className="flex-1 flex flex-col items-center space-y-6">
            <button
              onClick={() => setVistaActual('home')}
              className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
            >
              <Home className="w-5 h-5" />
            </button>
            <button
              onClick={() => setVistaActual('ventas')}
              className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
            </button>
            {puedeAccederStock && (
              <button
                onClick={() => setVistaActual('stock')}
                className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
              >
                <Package className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setVistaActual('mesas')}
              className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
            >
              <Utensils className="w-5 h-5" />
            </button>
            {puedeAccederCajas && (
              <button
                onClick={() => setVistaActual('cajas')}
                className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
              >
                <BarChart3 className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex flex-col items-center gap-4 pb-6">
            {puedeAccederConfiguracion && (
              <button className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center hover:bg-red-700 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={handleLogout}
              className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-red-600 transition-colors text-zinc-400 hover:text-white"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        <Configuracion
          onVolver={() => setVistaActual('home')}
          metodosPago={metodosPago}
          setMetodosPago={setMetodosPago}
          categorias={categorias}
          setCategorias={setCategorias}
        />
      </div>
    );
  }

  if (vistaActual === 'cajas') {
    return (
      <div className="min-h-screen bg-black text-white flex">
        {/* Sidebar */}
        <div className="w-16 bg-zinc-900 flex flex-col items-center py-6 space-y-8">
          <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center text-sm font-bold">
            CD
          </div>

          <div className="flex-1 flex flex-col items-center space-y-6">
            <button
              onClick={() => setVistaActual('home')}
              className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
            >
              <Home className="w-5 h-5" />
            </button>
            <button
              onClick={() => setVistaActual('ventas')}
              className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
            </button>
            {puedeAccederStock && (
              <button
                onClick={() => setVistaActual('stock')}
                className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
              >
                <Package className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setVistaActual('mesas')}
              className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
            >
              <Utensils className="w-5 h-5" />
            </button>
            {puedeAccederCajas && (
              <button className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center hover:bg-red-700 transition-colors">
                <BarChart3 className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex flex-col items-center gap-4 pb-6">
            {puedeAccederConfiguracion && (
              <button
                onClick={() => setVistaActual('configuracion')}
                className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={handleLogout}
              className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-red-600 transition-colors text-zinc-400 hover:text-white"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        <ConsultaCajas
          onVolver={() => setVistaActual('home')}
          ventasCaja={ventasCaja}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <div className="w-16 bg-zinc-900 flex flex-col items-center py-6 space-y-8">
        <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center text-sm font-bold">
          CD
        </div>

        <div className="flex-1 flex flex-col items-center space-y-6">
          <button className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center hover:bg-red-700 transition-colors">
            <Home className="w-5 h-5" />
          </button>
          <button
            onClick={() => setVistaActual('ventas')}
            className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
          {puedeAccederStock && (
            <button
              onClick={() => setVistaActual('stock')}
              className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
            >
              <Package className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => setVistaActual('mesas')}
            className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
          >
            <Utensils className="w-5 h-5" />
          </button>
          {puedeAccederCajas && (
            <button
              onClick={() => setVistaActual('cajas')}
              className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex flex-col items-center gap-4 pb-6">
          {puedeAccederConfiguracion && (
            <button
              onClick={() => setVistaActual('configuracion')}
              className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={handleLogout}
            className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-red-600 transition-colors text-zinc-400 hover:text-white"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="px-8 py-6 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">Centraldrinks</h1>
              <p className="text-zinc-400 text-sm">Panel de Control - Punto de Venta</p>
            </div>
            <div className="text-right text-sm text-zinc-400">
              <p className="capitalize">{currentDate}</p>
              <p>{currentTime}</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-8 overflow-auto">
          {/* Header con nombre de usuario */}
          <div className="mb-6">
            <p className="text-sm text-zinc-500">Bienvenido,</p>
            <p className="text-xl font-bold">{usuarioActual.nombre}</p>
            <p className="text-sm text-zinc-400 capitalize">Rol: {usuarioActual.rol}</p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <button
              onClick={() => setVistaActual('mesas')}
              className="bg-red-600 hover:bg-red-700 transition-colors rounded-lg p-6 flex items-center justify-center gap-3 text-lg font-medium"
            >
              <Utensils className="w-6 h-6" />
              Gestión de Mesas
            </button>
            <button
              onClick={() => setVistaActual('ventas')}
              className="bg-red-600 hover:bg-red-700 transition-colors rounded-lg p-6 flex items-center justify-center gap-3 text-lg font-medium"
            >
              <Receipt className="w-6 h-6" />
              Venta Mostrador
            </button>
            {puedeAccederStock && (
              <button
                onClick={() => setVistaActual('stock')}
                className="bg-red-600 hover:bg-red-700 transition-colors rounded-lg p-6 flex items-center justify-center gap-3 text-lg font-medium"
              >
                <Package className="w-6 h-6" />
                Gestión de Stock
              </button>
            )}
            {puedeAccederCajas && (
              <button
                onClick={() => setVistaActual('cajas')}
                className="bg-red-600 hover:bg-red-700 transition-colors rounded-lg p-6 flex items-center justify-center gap-3 text-lg font-medium"
              >
                <BarChart3 className="w-6 h-6" />
                Consulta de Cajas
              </button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <p className="text-zinc-400 text-sm">Total Ventas Hoy</p>
                <div className="text-red-500">$</div>
              </div>
              <p className="text-4xl font-bold">$0</p>
            </div>
            <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <p className="text-zinc-400 text-sm">Ventas Mesa</p>
                <Receipt className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-4xl font-bold">$0</p>
            </div>
            <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <p className="text-zinc-400 text-sm">Ventas Mostrador</p>
                <ShoppingCart className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-4xl font-bold">$0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}