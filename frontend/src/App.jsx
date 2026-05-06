import { useMemo, useState } from 'react';
import { Home, ShoppingCart, Package, BarChart3, Receipt, Utensils, Settings, LogOut } from 'lucide-react';
import { VentaMostrador } from './components/VentaMostrador.jsx';
import { GestionStock } from './components/GestionStock.jsx';
import { VentaMesa } from './components/VentaMesa.jsx';
import { GestionMesas } from './components/GestionMesas.jsx';
import { Configuracion } from './components/Configuracion.jsx';
import { ConsultaCajas } from './components/ConsultaCajas.jsx';
import { Login } from './components/Login.jsx';
import { useAuth } from './hooks/useAuth.jsx';
import { useDataStore } from './hooks/useDataStore.jsx';

export default function App() {
  const { user: usuarioActual, loading: authLoading, logout } = useAuth();
  const [vistaActual, setVistaActual] = useState('home');
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [cargaMesas, setCargaMesas] = useState({});

  const store = useDataStore({ enabled: !!usuarioActual });

  const handleLogout = () => {
    logout();
    setVistaActual('home');
    setMesaSeleccionada(null);
    setCargaMesas({});
  };

  const handleAbrirMesa = (numeroMesa) => {
    setMesaSeleccionada(numeroMesa);
  };

  const handleActualizarCargaMesa = (numeroMesa, productos) => {
    setCargaMesas((prev) => ({
      ...prev,
      [numeroMesa]: productos,
    }));
  };

  const handleConfirmarVentaMesa = async (numeroMesa, ventaPayload) => {
    await store.registrarVenta(ventaPayload);
    setCargaMesas((prev) => {
      const nuevo = { ...prev };
      delete nuevo[numeroMesa];
      return nuevo;
    });
    setMesaSeleccionada(null);
  };

  const ventasAbiertas = useMemo(
    () => store.ventas.filter((v) => v.cierreCajaId == null),
    [store.ventas]
  );

  const totalVentasAbiertas = useMemo(
    () => ventasAbiertas.reduce((sum, v) => sum + v.total, 0),
    [ventasAbiertas]
  );

  const totalVentasMesa = useMemo(
    () =>
      ventasAbiertas
        .filter((v) => v.tipo === 'mesa')
        .reduce((sum, v) => sum + v.total, 0),
    [ventasAbiertas]
  );

  const totalVentasMostrador = useMemo(
    () =>
      ventasAbiertas
        .filter((v) => v.tipo === 'mostrador')
        .reduce((sum, v) => sum + v.total, 0),
    [ventasAbiertas]
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Cargando...</div>
      </div>
    );
  }

  if (!usuarioActual) {
    return <Login />;
  }

  if (store.loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Cargando datos...</div>
      </div>
    );
  }

  if (store.error) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-4 p-8">
        <p className="text-red-500 text-lg">Error cargando datos: {store.error}</p>
        <button
          onClick={store.recargarTodo}
          className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg"
        >
          Reintentar
        </button>
        <button
          onClick={handleLogout}
          className="text-zinc-400 hover:text-white text-sm"
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  const esAdministrador = usuarioActual.rol === 'administrador';
  const puedeAccederStock = esAdministrador;
  const puedeAccederCajas = esAdministrador;
  const puedeAccederConfiguracion = esAdministrador;

  const currentDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const currentTime = new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const Sidebar = ({ active }) => (
    <div className="w-16 bg-zinc-900 flex flex-col items-center py-6 space-y-8">
      <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center text-sm font-bold">
        CD
      </div>

      <div className="flex-1 flex flex-col items-center space-y-6">
        <button
          onClick={() => setVistaActual('home')}
          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
            active === 'home' ? 'bg-red-600 hover:bg-red-700' : 'hover:bg-zinc-800'
          }`}
        >
          <Home className="w-5 h-5" />
        </button>
        <button
          onClick={() => setVistaActual('ventas')}
          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
            active === 'ventas' ? 'bg-red-600 hover:bg-red-700' : 'hover:bg-zinc-800'
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
        </button>
        {puedeAccederStock && (
          <button
            onClick={() => setVistaActual('stock')}
            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
              active === 'stock' ? 'bg-red-600 hover:bg-red-700' : 'hover:bg-zinc-800'
            }`}
          >
            <Package className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={() => setVistaActual('mesas')}
          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
            active === 'mesas' ? 'bg-red-600 hover:bg-red-700' : 'hover:bg-zinc-800'
          }`}
        >
          <Utensils className="w-5 h-5" />
        </button>
        {puedeAccederCajas && (
          <button
            onClick={() => setVistaActual('cajas')}
            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
              active === 'cajas' ? 'bg-red-600 hover:bg-red-700' : 'hover:bg-zinc-800'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex flex-col items-center gap-4 pb-6">
        {puedeAccederConfiguracion && (
          <button
            onClick={() => setVistaActual('configuracion')}
            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
              active === 'configuracion' ? 'bg-red-600 hover:bg-red-700' : 'hover:bg-zinc-800'
            }`}
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
  );

  if (vistaActual === 'stock' && !puedeAccederStock) setVistaActual('home');
  if (vistaActual === 'cajas' && !puedeAccederCajas) setVistaActual('home');
  if (vistaActual === 'configuracion' && !puedeAccederConfiguracion) setVistaActual('home');

  if (vistaActual === 'ventas') {
    return (
      <div className="min-h-screen bg-black text-white flex">
        <Sidebar active="ventas" />
        <VentaMostrador
          onVolver={() => setVistaActual('home')}
          metodosPago={store.metodosPago}
          productos={store.productos}
          ventas={ventasAbiertas.filter((v) => v.tipo === 'mostrador')}
          onRegistrarVenta={store.registrarVenta}
        />
      </div>
    );
  }

  if (vistaActual === 'stock') {
    return (
      <div className="min-h-screen bg-black text-white flex">
        <Sidebar active="stock" />
        <GestionStock
          onVolver={() => setVistaActual('home')}
          categorias={store.categorias}
          productos={store.productos}
          onCrearProducto={store.crearProducto}
          onActualizarProducto={store.actualizarProducto}
          onEliminarProducto={store.eliminarProducto}
        />
      </div>
    );
  }

  if (vistaActual === 'mesas') {
    if (mesaSeleccionada !== null) {
      return (
        <div className="min-h-screen bg-black text-white flex">
          <Sidebar active="mesas" />
          <VentaMesa
            numeroMesa={mesaSeleccionada}
            onVolver={() => setMesaSeleccionada(null)}
            onConfirmarVenta={handleConfirmarVentaMesa}
            metodosPago={store.metodosPago}
            productos={store.productos}
            cargaInicial={cargaMesas[mesaSeleccionada] || []}
            onActualizarCarga={handleActualizarCargaMesa}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-black text-white flex">
        <Sidebar active="mesas" />
        <GestionMesas
          onVolver={() => setVistaActual('home')}
          mesas={store.mesas}
          cargaMesas={cargaMesas}
          ventasMesa={ventasAbiertas.filter((v) => v.tipo === 'mesa')}
          onAbrirMesa={handleAbrirMesa}
          onCrearMesa={store.crearMesa}
          onEliminarMesa={store.eliminarMesa}
          esAdministrador={esAdministrador}
        />
      </div>
    );
  }

  if (vistaActual === 'configuracion') {
    return (
      <div className="min-h-screen bg-black text-white flex">
        <Sidebar active="configuracion" />
        <Configuracion
          onVolver={() => setVistaActual('home')}
          metodosPago={store.metodosPago}
          onCrearMetodoPago={store.crearMetodoPago}
          onActualizarMetodoPago={store.actualizarMetodoPago}
          onEliminarMetodoPago={store.eliminarMetodoPago}
          categorias={store.categorias}
          onCrearCategoria={store.crearCategoria}
          onActualizarCategoria={store.actualizarCategoria}
          onEliminarCategoria={store.eliminarCategoria}
        />
      </div>
    );
  }

  if (vistaActual === 'cajas') {
    return (
      <div className="min-h-screen bg-black text-white flex">
        <Sidebar active="cajas" />
        <ConsultaCajas
          onVolver={() => setVistaActual('home')}
          cierres={store.cierres}
          ventasAbiertas={ventasAbiertas}
          onCerrarCaja={store.cerrarCajaActual}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      <Sidebar active="home" />

      <div className="flex-1 flex flex-col">
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

        <div className="flex-1 p-8 overflow-auto">
          <div className="mb-6">
            <p className="text-sm text-zinc-500">Bienvenido,</p>
            <p className="text-xl font-bold">{usuarioActual.nombre}</p>
            <p className="text-sm text-zinc-400 capitalize">Rol: {usuarioActual.rol}</p>
          </div>

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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <p className="text-zinc-400 text-sm">Total Ventas (caja actual)</p>
                <div className="text-red-500">$</div>
              </div>
              <p className="text-4xl font-bold">${totalVentasAbiertas.toLocaleString()}</p>
            </div>
            <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <p className="text-zinc-400 text-sm">Ventas Mesa</p>
                <Receipt className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-4xl font-bold">${totalVentasMesa.toLocaleString()}</p>
            </div>
            <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <p className="text-zinc-400 text-sm">Ventas Mostrador</p>
                <ShoppingCart className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-4xl font-bold">${totalVentasMostrador.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
