import { useEffect, useMemo, useState } from 'react';
import { Home, ShoppingCart, Package, BarChart3, Receipt, Utensils, Settings, LogOut, Wine, ArrowDown, Clock, List, Activity, ArrowUp, ShoppingBag, Lock, Plus, Archive, AlertTriangle, User, History, Check, Search, X, Wallet, CreditCard } from 'lucide-react';
import { AbrirCajaModal } from './components/AbrirCajaModal.jsx';
import { CerrarCajaModal } from './components/CerrarCajaModal.jsx';
import { AppNav } from './components/AppNav.jsx';
import { SuscripcionPanel } from './components/SuscripcionPanel.jsx';
import { ModalSuscripcionExpirada } from './components/ModalSuscripcionExpirada.jsx';
import { BannerVencimiento } from './components/BannerVencimiento.jsx';
import { VentaMostrador } from './components/VentaMostrador.jsx';
import { GestionStock } from './components/GestionStock.jsx';
import { VentaMesa } from './components/VentaMesa.jsx';
import { GestionMesas } from './components/GestionMesas.jsx';
import { Configuracion } from './components/Configuracion.jsx';
import { ConsultaCajas } from './components/ConsultaCajas.jsx';
import { Stats } from './components/Stats.jsx';
import { Login } from './components/Login.jsx';
import { useAuth } from './hooks/useAuth.jsx';
import { useDataStore } from './hooks/useDataStore.jsx';
import { formatearFechaCorta, parseFechaDB } from './lib/fechas.js';

export default function App() {
  const { user: usuarioActual, loading: authLoading, logout } = useAuth();
  const [vistaActual, setVistaActual] = useState('home');
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [cargaMesas, setCargaMesas] = useState({});
  const [nombresMesas, setNombresMesas] = useState({});
  const [showAbrirCajaModal, setShowAbrirCajaModal] = useState(false);
  const [showCerrarCajaModal, setShowCerrarCajaModal] = useState(false);

  const store = useDataStore({ enabled: !!usuarioActual });
  const cajaAbierta = store.cajaActual?.abierta ?? false;
  const resumenCaja = store.cajaActual?.resumen;

  const handleLogout = () => {
    logout();
    setVistaActual('home');
    setMesaSeleccionada(null);
    setCargaMesas({});
    setNombresMesas({});
  };

  const handleAbrirMesa = (numeroMesa) => {
    setMesaSeleccionada(numeroMesa);
  };

  const handleActualizarNombreMesa = (numeroMesa, nombre) => {
    setNombresMesas((prev) => ({
      ...prev,
      [numeroMesa]: nombre,
    }));
  };

  const handleActualizarCargaMesa = (numeroMesa, productos) => {
    setCargaMesas((prev) => ({
      ...prev,
      [numeroMesa]: productos,
    }));
  };

  const handleConfirmarVentaMesa = async (numeroMesa, ventaPayload) => {
    const venta = await store.registrarVenta(ventaPayload);
    setCargaMesas((prev) => {
      const nuevo = { ...prev };
      delete nuevo[numeroMesa];
      return nuevo;
    });
    setNombresMesas((prev) => {
      const nuevo = { ...prev };
      delete nuevo[numeroMesa];
      return nuevo;
    });
    setMesaSeleccionada(null);
    return venta;
  };

  const mesasPendientes = useMemo(() => {
    return Object.entries(cargaMesas)
      .filter(([, items]) => items && items.length > 0)
      .map(([numeroMesa, items]) => ({
        numeroMesa: Number(numeroMesa),
        cantidadItems: items.reduce((sum, i) => sum + i.cantidad, 0),
        total: items.reduce((sum, i) => sum + i.precio * i.cantidad, 0),
      }));
  }, [cargaMesas]);

  const ventasAbiertas = useMemo(() => {
    const sesionId = store.cajaActual?.sesion?.id;
    if (!cajaAbierta || !sesionId) return [];
    return store.ventas.filter((v) => v.cierreCajaId === sesionId);
  }, [store.ventas, store.cajaActual?.sesion?.id, cajaAbierta]);

  const totalVentasAbiertas = useMemo(
    () => ventasAbiertas.reduce((sum, v) => sum + v.total, 0),
    [ventasAbiertas]
  );

  const totalGastosFijos = useMemo(
    () => store.gastosFijos.reduce((sum, g) => sum + g.monto, 0),
    [store.gastosFijos]
  );

  const ingresosTotalesMes = useMemo(() => {
    const ahora = new Date();
    return store.ventas
      .filter((v) => {
        const d = parseFechaDB(v.fecha);
        return d.getMonth() === ahora.getMonth() && d.getFullYear() === ahora.getFullYear();
      })
      .reduce((sum, v) => sum + v.total, 0);
  }, [store.ventas]);

  const gastosCubiertos = totalGastosFijos > 0 && ingresosTotalesMes >= totalGastosFijos;

  const productosBajoStock = useMemo(
    () => store.productos.filter((p) => p.stock <= (p.stockMinimo || 5)),
    [store.productos]
  );

  const [showAbrirBotellaModal, setShowAbrirBotellaModal] = useState(false);
  const [procesandoBotella, setProcesandoBotella] = useState(false);

  const [showRetirarModal, setShowRetirarModal] = useState(false);
  const [procesandoRetiro, setProcesandoRetiro] = useState(false);

  const agregarLog = async (tipo, mensaje, detalle) => {
    try {
      await store.crearAuditLog({ tipo, mensaje, detalle });
    } catch {
      // no bloquear la acción principal si falla el log
    }
  };

  const handleAbrirBotella = async (producto) => {
    setProcesandoBotella(true);
    try {
      await store.crearBotellaBarra({
        productoId: producto.id,
        nombreProducto: producto.nombre,
      });

      await agregarLog('barra', 'Apertura en Barra', `${producto.nombre} (1 botella)`);
      setShowAbrirBotellaModal(false);
    } catch (error) {
      alert('Error al abrir la botella: ' + error.message);
    } finally {
      setProcesandoBotella(false);
    }
  };

  const handleVaciarBotella = async (botellaId) => {
    const botella = store.botellasBarra.find((b) => b.id === botellaId);
    if (botella) {
      await store.eliminarBotellaBarra(botellaId);
      await agregarLog('barra', 'Botella Terminada', `${botella.nombre} (marcada como vacía)`);
    }
  };

  const handleRetirarMercaderia = async (producto, cantidad, motivo) => {
    setProcesandoRetiro(true);
    try {
      const payload = {
        nombre: producto.nombre,
        categoriaId: producto.categoriaId || null,
        costoUnitario: producto.costoUnitario,
        precioMesa: producto.precioMesa,
        precioMostrador: producto.precioMostrador,
        stock: producto.stock - cantidad,
        stockMinimo: producto.stockMinimo || 5
      };
      await store.actualizarProducto(producto.id, payload);

      await agregarLog('stock', 'Retiro de Mercadería', `${producto.nombre} (-${cantidad} unidades). Motivo: ${motivo}`);
      setShowRetirarModal(false);
    } catch (error) {
      alert('Error al retirar mercadería: ' + error.message);
    } finally {
      setProcesandoRetiro(false);
    }
  };

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

  // ── Rol creador: panel exclusivo, sin acceso al resto de la app ─────────
  if (usuarioActual.rol === 'creador') {
    return <SuscripcionPanel onLogout={handleLogout} />;
  }

  // ── Estado de suscripción ────────────────────────────────────────────────
  const suscripcion = usuarioActual.suscripcion ?? null;
  const suscripcionExpirada = suscripcion?.estado === 'expirada';
  const suscripcionPorVencer = suscripcion?.estado === 'por_vencer';

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
    hour12: false,
  });

  const Sidebar = ({ active }) => (
    <AppNav
      active={active}
      onNavigate={setVistaActual}
      onLogout={handleLogout}
      esAdministrador={esAdministrador}
      puedeAccederStock={puedeAccederStock}
      puedeAccederCajas={puedeAccederCajas}
      puedeAccederConfiguracion={puedeAccederConfiguracion}
      sucursalNombre={usuarioActual.sucursalNombre ?? null}
    />
  );

  if (vistaActual === 'stock' && !puedeAccederStock) setVistaActual('home');
  if (vistaActual === 'stats' && !esAdministrador) setVistaActual('home');
  if (vistaActual === 'cajas' && !puedeAccederCajas) setVistaActual('home');
  if (vistaActual === 'configuracion' && !puedeAccederConfiguracion) setVistaActual('home');

  let contenido = null;

  if (vistaActual === 'ventas') {
    contenido = (
      <div className="flex-1 relative flex">
          <div className={`flex-1 flex flex-col ${!cajaAbierta ? 'filter blur-md pointer-events-none opacity-40 select-none' : ''}`}>
            <VentaMostrador
              onVolver={() => setVistaActual('home')}
              metodosPago={store.metodosPago}
              productos={store.productos}
              ventas={ventasAbiertas.filter((v) => v.tipo === 'mostrador')}
              onRegistrarVenta={store.registrarVenta}
            />
          </div>
          {!cajaAbierta && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl flex flex-col items-center text-center shadow-2xl max-w-md mx-4">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Caja Cerrada</h2>
                <p className="text-zinc-400 mb-6">Abrí la caja para poder acceder al punto de venta.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowAbrirCajaModal(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Abrir Caja
                  </button>
                  <button onClick={() => setVistaActual('home')} className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">Volver al Inicio</button>
                </div>
              </div>
            </div>
          )}
      </div>
    );
  } else if (vistaActual === 'stock') {
    contenido = (
      <GestionStock
          onVolver={() => setVistaActual('home')}
          categorias={store.categorias}
          productos={store.productos}
          onCrearProducto={store.crearProducto}
          onActualizarProducto={store.actualizarProducto}
          onEliminarProducto={store.eliminarProducto}
        />
    );
  } else if (vistaActual === 'mesas') {
    contenido = (
      <div className="flex-1 relative flex">
          <div className={`flex-1 flex flex-col ${!cajaAbierta ? 'filter blur-md pointer-events-none opacity-40 select-none' : ''}`}>
            {mesaSeleccionada !== null ? (
              <VentaMesa
                numeroMesa={mesaSeleccionada}
                onVolver={() => setMesaSeleccionada(null)}
                onConfirmarVenta={handleConfirmarVentaMesa}
                metodosPago={store.metodosPago}
                productos={store.productos}
                cargaInicial={cargaMesas[mesaSeleccionada] || []}
                onActualizarCarga={handleActualizarCargaMesa}
                nombreMesa={nombresMesas[mesaSeleccionada] || ''}
                onActualizarNombre={handleActualizarNombreMesa}
              />
            ) : (
              <GestionMesas
                onVolver={() => setVistaActual('home')}
                mesas={store.mesas}
                cargaMesas={cargaMesas}
                nombresMesas={nombresMesas}
                ventasMesa={ventasAbiertas.filter((v) => v.tipo === 'mesa')}
                metodosPago={store.metodosPago}
                onAbrirMesa={handleAbrirMesa}
                onCrearMesa={store.crearMesa}
                onEliminarMesa={store.eliminarMesa}
                onActualizarNombreMesa={handleActualizarNombreMesa}
                esAdministrador={esAdministrador}
              />
            )}
          </div>
          {!cajaAbierta && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl flex flex-col items-center text-center shadow-2xl max-w-md mx-4">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Caja Cerrada</h2>
                <p className="text-zinc-400 mb-6">Abrí la caja para poder acceder a la atención de mesas.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowAbrirCajaModal(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Abrir Caja
                  </button>
                  <button onClick={() => setVistaActual('home')} className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">Volver al Inicio</button>
                </div>
              </div>
            </div>
          )}
      </div>
    );
  } else if (vistaActual === 'configuracion') {
    contenido = (
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
          gastosFijos={store.gastosFijos}
          onCrearGastoFijo={store.crearGastoFijo}
          onActualizarGastoFijo={store.actualizarGastoFijo}
          onEliminarGastoFijo={store.eliminarGastoFijo}
        />
    );
  } else if (vistaActual === 'cajas') {
    contenido = (
        <ConsultaCajas
          onVolver={() => setVistaActual('home')}
          cierres={store.cierres}
          ventasAbiertas={ventasAbiertas}
          cajaActual={store.cajaActual}
          onCerrarCaja={store.cerrarCajaActual}
          metodosPago={store.metodosPago}
          mesasPendientes={mesasPendientes}
        />
    );
  } else if (vistaActual === 'stats') {
    contenido = (
        <Stats
          onVolver={() => setVistaActual('home')}
          ventas={store.ventas}
          gastosFijos={store.gastosFijos}
          gastos={store.gastos}
          productos={store.productos}
          onCrearGasto={store.crearGasto}
        />
    );
  } else {
    contenido = (
      <>
      <div className="flex-1 flex flex-col">
        <header className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 border-b border-zinc-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Panel de Inicio</h1>
            <div className="flex items-center gap-2">
              <p className="text-zinc-400 text-sm">Resumen en vivo de tu negocio</p>
              {usuarioActual.sucursalNombre && (
                <span className="inline-flex items-center gap-1 bg-red-600/20 text-red-400 text-xs font-semibold px-2 py-0.5 rounded-full border border-red-600/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  {usuarioActual.sucursalNombre}
                </span>
              )}
            </div>
            </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <button onClick={() => setShowRetirarModal(true)} className="bg-zinc-800 hover:bg-zinc-700 transition-colors rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 flex items-center gap-2 font-medium text-zinc-300 text-sm sm:text-base">
              <Package className="w-5 h-5" />
              Retirar
            </button>
            {!cajaAbierta && (
              <button
                onClick={() => setShowAbrirCajaModal(true)}
                className="bg-green-500 hover:bg-green-600 transition-colors rounded-lg px-4 py-2.5 flex items-center gap-2 font-bold text-white shadow-lg shadow-green-500/20"
              >
                <Lock className="w-5 h-5" />
                Abrir Caja
              </button>
            )}
            {cajaAbierta && (
              <button
                onClick={() => (esAdministrador ? setVistaActual('cajas') : setShowCerrarCajaModal(true))}
                className="bg-red-500 hover:bg-red-600 transition-colors rounded-lg px-4 py-2.5 flex items-center gap-2 font-bold text-white shadow-lg shadow-red-500/20"
              >
                <Lock className="w-5 h-5" />
                Cerrar Caja
              </button>
            )}
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {esAdministrador && productosBajoStock.length > 0 && (
            <div className="mb-8 bg-red-900/20 border border-red-700/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-red-900/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-red-500 font-bold text-lg">¡Atención! Stock bajo detectado</h3>
                  <p className="text-sm text-red-200/70">
                    Hay {productosBajoStock.length} producto(s) por debajo de su nivel de stock mínimo.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setVistaActual('stock')}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors whitespace-nowrap"
              >
                Ver Stock
              </button>
            </div>
          )}

          {esAdministrador ? (
          <div className="space-y-6">
            {/* 2. FILA SUPERIOR (Métricas) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Tarjeta 1 */}
              <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800 shadow-[0_0_15px_rgba(168,85,247,0.15)] flex flex-col justify-between h-[140px]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-purple-500" />
                  </div>
                  <p className="text-zinc-400 text-sm font-medium">Estado de Caja</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${cajaAbierta ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <p className="text-2xl font-bold text-white">{cajaAbierta ? 'Abierta' : 'Cerrada'}</p>
                </div>
                {cajaAbierta && store.cajaActual?.sesion && (
                  <p className="text-xs text-zinc-500 mt-2">
                    Efectivo inicial: ${store.cajaActual.sesion.efectivoInicial.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Tarjeta 2 */}
              <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800 flex flex-col justify-between h-[140px]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <ArrowUp className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-zinc-400 text-sm font-medium">Ventas de Hoy</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">$0.00</p>
                </div>
              </div>

              {/* Tarjeta 3 */}
              <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800 flex flex-col justify-between h-[140px]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-zinc-400 text-sm font-medium">Tickets Emitidos</p>
                </div>
                <div className="flex items-baseline gap-3">
                  <p className="text-3xl font-bold text-white">0</p>
                  <p className="text-sm text-zinc-500 mt-1">Sin actividad</p>
                </div>
              </div>

              {/* Tarjeta 4 */}
              <PanelBotellasBarra
                botellas={store.botellasBarra}
                onAbrir={() => setShowAbrirBotellaModal(true)}
                onVaciar={handleVaciarBotella}
                compact
              />
            </div>

            {cajaAbierta && resumenCaja && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-zinc-900/50 rounded-xl p-6 border border-emerald-800/40">
                  <div className="flex items-center gap-3 mb-3">
                    <Wallet className="w-5 h-5 text-emerald-500" />
                    <p className="text-zinc-400 text-sm font-medium">Efectivo esperado en caja</p>
                  </div>
                  <p className="text-3xl font-bold text-emerald-500">
                    ${resumenCaja.efectivoEsperado.toLocaleString()}
                  </p>
                </div>
                <div className="bg-zinc-900/50 rounded-xl p-6 border border-blue-800/40">
                  <div className="flex items-center gap-3 mb-3">
                    <CreditCard className="w-5 h-5 text-blue-500" />
                    <p className="text-zinc-400 text-sm font-medium">Virtual / Transferencias</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-500">
                    ${resumenCaja.ingresoVirtual.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* 3. SECCIÓN INFERIOR (Contenido Principal) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tarjeta Izquierda (Actividad Reciente) */}
              <div className="lg:col-span-2 bg-zinc-900/50 rounded-xl border border-zinc-800 flex flex-col min-h-[320px]">
                <div className="p-6 border-b border-zinc-800/50 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">Actividad Reciente</h2>
                  <Clock className="w-5 h-5 text-zinc-500" />
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  {!cajaAbierta ? (
                    <>
                      <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
                        <Clock className="w-8 h-8 text-zinc-600" />
                      </div>
                      <p className="text-xl font-bold text-white mb-2">La caja está cerrada</p>
                      <p className="text-zinc-500">Abre la caja para comenzar</p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                        <Activity className="w-8 h-8 text-green-500" />
                      </div>
                      <p className="text-xl font-bold text-white mb-2">Caja Operativa</p>
                      <p className="text-zinc-500">Lista para registrar movimientos</p>
                    </>
                  )}
                </div>
              </div>

              {/* Tarjeta Derecha (Gastos Fijos) */}
              <div className="lg:col-span-1 bg-zinc-900/50 rounded-xl border border-zinc-800 flex flex-col min-h-[320px]">
                <div className="p-6 border-b border-zinc-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Receipt className="w-4 h-4 text-blue-500" />
                    </div>
                    <h2 className="text-lg font-bold text-white">Gastos Fijos</h2>
                  </div>
                  {gastosCubiertos && (
                    <span className="px-2.5 py-1 bg-green-500/20 text-green-500 text-[10px] font-bold uppercase tracking-wider rounded-md border border-green-500/30">
                      Gastos Cubiertos
                    </span>
                  )}
                </div>
                <div className="flex-1 p-6 flex flex-col">
                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[160px] pr-2">
                    {store.gastosFijos.length === 0 ? (
                      <p className="text-zinc-500 text-sm text-center py-4">No hay gastos fijos</p>
                    ) : (
                      store.gastosFijos.map(g => (
                        <div key={g.id} className="flex items-center justify-between">
                          <span className="text-zinc-400">{g.nombre}</span>
                          <span className="text-white font-medium">${g.monto.toLocaleString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="border-t border-zinc-800 pt-5 mt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Total a cubrir:</span>
                      <span className="text-white font-bold">${totalGastosFijos.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. HISTORIAL DE ACTIVIDAD DEL SISTEMA */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 flex flex-col mt-6">
              <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <History className="w-4 h-4 text-blue-500" />
                </div>
                <h2 className="text-lg font-bold text-white">Registro de Actividad del Sistema</h2>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {store.auditLogs.map((log, idx) => (
                    <div key={log.id} className="flex gap-4 relative">
                      {idx !== store.auditLogs.length - 1 && (
                        <div className="absolute top-10 left-5 bottom-[-24px] w-px bg-zinc-800"></div>
                      )}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ${
                        log.tipo === 'ingreso' ? 'bg-blue-500/20' :
                        log.tipo === 'stock' ? 'bg-amber-500/20' :
                        log.tipo === 'gasto' ? 'bg-red-500/20' :
                        log.tipo === 'barra' ? 'bg-purple-500/20' :
                        'bg-zinc-700/50'
                      }`}>
                        {log.tipo === 'ingreso' ? <User className="w-5 h-5 text-blue-500" /> :
                         log.tipo === 'stock' ? <Package className="w-5 h-5 text-amber-500" /> :
                         log.tipo === 'gasto' ? <ArrowDown className="w-5 h-5 text-red-500" /> :
                         log.tipo === 'barra' ? <Wine className="w-5 h-5 text-purple-500" /> :
                         <Settings className="w-5 h-5 text-zinc-400" />}
                      </div>
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
                          <p className="font-bold text-white">{log.mensaje}</p>
                          <span className="text-xs text-zinc-500">
                            {formatearFechaCorta(log.fecha)} hs
                          </span>
                        </div>
                        <p className="text-sm text-zinc-400">{log.detalle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </div>
          ) : (
            <>
              {cajaAbierta && resumenCaja && (
                <>
                  <h2 className="text-lg font-bold text-white mb-4">Arqueo de Caja (deberías tener)</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <div className="bg-zinc-900/50 rounded-xl p-6 border border-emerald-800/50 relative overflow-hidden">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-emerald-500" />
                          </div>
                          <div>
                            <p className="text-zinc-400 text-sm font-medium">Efectivo en caja</p>
                            <p className="text-xs text-zinc-500">Inicial + ventas efectivo − gastos efectivo</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-4xl font-bold text-emerald-500">
                        ${resumenCaja.efectivoEsperado.toLocaleString()}
                      </p>
                      <div className="mt-4 space-y-1 text-xs text-zinc-500">
                        <p>Inicial: ${(store.cajaActual?.sesion?.efectivoInicial || 0).toLocaleString()}</p>
                        <p>+ Ventas efectivo: ${resumenCaja.ingresoEfectivo.toLocaleString()}</p>
                        {resumenCaja.egresoEfectivo > 0 && (
                          <p>− Gastos efectivo: ${resumenCaja.egresoEfectivo.toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                    <div className="bg-zinc-900/50 rounded-xl p-6 border border-blue-800/50 relative overflow-hidden">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-zinc-400 text-sm font-medium">Transferencias / Virtual</p>
                            <p className="text-xs text-zinc-500">Tarjetas, transferencias y otros</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-4xl font-bold text-blue-500">
                        ${resumenCaja.ingresoVirtual.toLocaleString()}
                      </p>
                      <p className="mt-4 text-xs text-zinc-500">
                        Total ventas del turno: ${resumenCaja.ingresoTotal.toLocaleString()} ({resumenCaja.cantidadVentas} tickets)
                      </p>
                    </div>
                  </div>
                </>
              )}

              {!cajaAbierta && (
                <div className="mb-8 bg-amber-900/20 border border-amber-700/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Lock className="w-8 h-8 text-amber-500 shrink-0" />
                    <div>
                      <h3 className="text-amber-500 font-bold">Caja cerrada</h3>
                      <p className="text-sm text-amber-200/70">
                        Abrí la caja para comenzar el turno y ver el arqueo.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAbrirCajaModal(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors whitespace-nowrap"
                  >
                    Abrir Caja
                  </button>
                </div>
              )}

              <PanelBotellasBarra
                botellas={store.botellasBarra}
                onAbrir={() => setShowAbrirBotellaModal(true)}
                onVaciar={handleVaciarBotella}
              />

              <h2 className="text-lg font-bold text-white mb-4">Acciones Rápidas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <button
                  onClick={() => setVistaActual('mesas')}
                  className="bg-red-600 hover:bg-red-700 transition-all transform hover:-translate-y-1 rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center gap-4 text-lg sm:text-xl font-bold shadow-lg shadow-red-900/20"
                >
                  <Utensils className="w-10 h-10" />
                  Gestión de Mesas
                </button>
                <button
                  onClick={() => setVistaActual('ventas')}
                  className="bg-red-600 hover:bg-red-700 transition-all transform hover:-translate-y-1 rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center gap-4 text-lg sm:text-xl font-bold shadow-lg shadow-red-900/20"
                >
                  <Receipt className="w-10 h-10" />
                  Venta Mostrador
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <ModalAbrirBotella
        isOpen={showAbrirBotellaModal}
        onClose={() => setShowAbrirBotellaModal(false)}
        productos={store.productos}
        onAbrir={handleAbrirBotella}
        procesando={procesandoBotella}
      />

      <ModalRetirarMercaderia
        isOpen={showRetirarModal}
        onClose={() => setShowRetirarModal(false)}
        productos={store.productos}
        onRetirar={handleRetirarMercaderia}
        procesando={procesandoRetiro}
      />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {suscripcionExpirada && <ModalSuscripcionExpirada onLogout={handleLogout} />}
      {suscripcionPorVencer && (
        <BannerVencimiento
          diasRestantes={suscripcion.diasRestantes}
          fechaVencimiento={suscripcion.fechaVencimiento}
        />
      )}
      <Sidebar active={vistaActual} />
      <div className="min-h-screen flex flex-col md:ml-16 pb-20 md:pb-0">{contenido}</div>
      <AbrirCajaModal
        isOpen={showAbrirCajaModal}
        onClose={() => setShowAbrirCajaModal(false)}
        onConfirmar={store.abrirCaja}
      />
      <CerrarCajaModal
        isOpen={showCerrarCajaModal}
        onClose={() => setShowCerrarCajaModal(false)}
        onConfirmar={store.cerrarCajaActual}
        cantidadVentas={ventasAbiertas.length}
        totalVentas={totalVentasAbiertas}
        resumen={resumenCaja}
        efectivoInicial={store.cajaActual?.sesion?.efectivoInicial ?? 0}
        mesasPendientes={mesasPendientes}
      />
    </div>
  );
}

function PanelBotellasBarra({ botellas, onAbrir, onVaciar, compact = false }) {
  if (compact) {
    return (
      <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800 flex flex-col h-[140px] relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
              <Wine className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-zinc-400 text-sm font-medium">En Barra ({botellas.length})</p>
          </div>
          <button
            onClick={onAbrir}
            className="w-7 h-7 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors shrink-0"
            title="Abrir botella"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto pr-1 space-y-2">
          {botellas.length === 0 ? (
            <p className="text-sm text-zinc-500">No hay botellas</p>
          ) : (
            botellas.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between bg-zinc-800/50 rounded-lg px-3 py-1.5 border border-zinc-700/50"
              >
                <span className="text-sm truncate mr-2 font-medium text-zinc-300" title={b.nombre}>
                  {b.nombre}
                </span>
                <button
                  onClick={() => onVaciar(b.id)}
                  className="text-zinc-500 hover:text-green-500 transition-colors p-1"
                  title="Marcar como vacía"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-10 bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <Wine className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Botellas en Barra</h2>
            <p className="text-sm text-zinc-500">
              {botellas.length === 0
                ? 'No hay botellas abiertas'
                : `${botellas.length} botella${botellas.length === 1 ? '' : 's'} abierta${botellas.length === 1 ? '' : 's'}`}
            </p>
          </div>
        </div>
        <button
          onClick={onAbrir}
          className="bg-purple-600 hover:bg-purple-700 transition-colors rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 font-medium w-full sm:w-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          Abrir Botella
        </button>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {botellas.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-4">Abrí una botella para llevar el control de la barra.</p>
        ) : (
          botellas.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between bg-zinc-800/50 rounded-lg px-4 py-3 border border-zinc-700/50"
            >
              <span className="font-medium text-zinc-200">{b.nombre}</span>
              <button
                onClick={() => onVaciar(b.id)}
                className="text-zinc-400 hover:text-green-500 transition-colors flex items-center gap-2 text-sm"
                title="Marcar como vacía"
              >
                <Check className="w-4 h-4" />
                Vacía
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ModalAbrirBotella({ isOpen, onClose, productos, onAbrir, procesando }) {
  const [busqueda, setBusqueda] = useState('');

  if (!isOpen) return null;

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-lg w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">Abrir Botella en Barra</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="p-6 border-b border-zinc-800">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar producto a abrir..."
              className="w-full bg-zinc-800 rounded-lg pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {productosFiltrados.map((producto) => (
            <div key={producto.id} className="bg-zinc-800 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-white mb-1">{producto.nombre}</p>
                <p className="text-sm text-zinc-400">Stock actual: {producto.stock}</p>
              </div>
              <button
                onClick={() => onAbrir(producto)}
                disabled={producto.stock <= 0 || procesando}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors px-4 py-2 rounded-lg font-medium text-white flex items-center justify-center gap-2 w-full sm:w-auto shrink-0"
              >
                {procesando ? 'Abriendo...' : 'Abrir'}
              </button>
            </div>
          ))}

          {productosFiltrados.length === 0 && (
            <p className="text-center text-zinc-500 py-4">No se encontraron productos.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ModalRetirarMercaderia({ isOpen, onClose, productos, onRetirar, procesando }) {
  const [busqueda, setBusqueda] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');

  useEffect(() => {
    if (isOpen) {
      setBusqueda('');
      setProductoSeleccionado(null);
      setCantidad('');
      setMotivo('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const qty = parseInt(cantidad, 10);
    if (isNaN(qty) || qty <= 0) {
      alert('Ingresa una cantidad válida mayor a 0');
      return;
    }
    if (qty > productoSeleccionado.stock) {
      alert('No hay suficiente stock para retirar esa cantidad');
      return;
    }
    onRetirar(productoSeleccionado, qty, motivo.trim() || 'Uso interno / Merma');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-lg w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">Retirar Mercadería</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {!productoSeleccionado ? (
          <>
            <div className="p-6 border-b border-zinc-800">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar producto a retirar..."
                  className="w-full bg-zinc-800 rounded-lg pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {productosFiltrados.map((producto) => (
                <div key={producto.id} className="bg-zinc-800 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white mb-1">{producto.nombre}</p>
                    <p className="text-sm text-zinc-400">Stock actual: {producto.stock}</p>
                  </div>
                  <button
                    onClick={() => setProductoSeleccionado(producto)}
                    disabled={producto.stock <= 0}
                    className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 transition-colors px-4 py-2 rounded-lg font-medium text-white flex items-center gap-2"
                  >
                    Seleccionar
                  </button>
                </div>
              ))}

              {productosFiltrados.length === 0 && (
                <p className="text-center text-zinc-500 py-4">No se encontraron productos.</p>
              )}
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700/50 mb-6">
              <p className="text-sm text-zinc-400 mb-1">Producto seleccionado:</p>
              <div className="flex justify-between items-center">
                <p className="font-bold text-lg">{productoSeleccionado.nombre}</p>
                <button type="button" onClick={() => setProductoSeleccionado(null)} className="text-red-500 text-sm hover:underline">Cambiar producto</button>
              </div>
              <p className="text-sm text-zinc-400 mt-1">Stock disponible: {productoSeleccionado.stock}</p>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">Cantidad a retirar</label>
              <input
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600 border border-zinc-700"
                placeholder="Ej: 1"
                min="1"
                max={productoSeleccionado.stock}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">Motivo / Asunto (Opcional)</label>
              <input
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600 border border-zinc-700"
                placeholder="Ej: Consumo interno, Botella rota..."
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={procesando}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors rounded-lg py-4 font-medium"
              >
                {procesando ? 'Procesando...' : 'Confirmar Retiro'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
