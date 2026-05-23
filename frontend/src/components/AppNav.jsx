import { useState } from 'react';
import {
  Home,
  ShoppingCart,
  Utensils,
  Package,
  BarChart3,
  Archive,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

function NavButton({ active, onClick, title, children, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`w-12 h-12 shrink-0 rounded-lg flex items-center justify-center transition-colors ${
        active ? 'bg-red-600 hover:bg-red-700' : 'hover:bg-zinc-800'
      } ${className}`}
      title={title}
    >
      {children}
    </button>
  );
}

function MobileNavItem({ active, onClick, label, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 flex-1 min-w-0 py-2 transition-colors ${
        active ? 'text-red-500' : 'text-zinc-400 hover:text-white'
      }`}
    >
      {children}
      <span className="text-[10px] font-medium truncate max-w-full px-1">{label}</span>
    </button>
  );
}

export function AppNav({
  active,
  onNavigate,
  onLogout,
  esAdministrador,
  puedeAccederStock,
  puedeAccederCajas,
  puedeAccederConfiguracion,
}) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const ir = (vista) => {
    onNavigate(vista);
    setMenuAbierto(false);
  };

  const extraItems = [
    puedeAccederStock && { id: 'stock', label: 'Stock', icon: Package },
    esAdministrador && { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
    puedeAccederCajas && { id: 'cajas', label: 'Cajas', icon: Archive },
    puedeAccederConfiguracion && { id: 'configuracion', label: 'Configuración', icon: Settings },
  ].filter(Boolean);

  const extraActivo = extraItems.some((item) => item.id === active);

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-50 w-16 h-screen bg-zinc-900 border-r border-zinc-800 flex-col items-center py-4">
        <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center text-sm font-bold shrink-0">
          C22
        </div>

        <nav className="mt-4 flex flex-col items-center gap-2 w-full px-2 flex-1">
          <NavButton active={active === 'home'} onClick={() => ir('home')} title="Inicio">
            <Home className="w-5 h-5" />
          </NavButton>
          <NavButton active={active === 'ventas'} onClick={() => ir('ventas')} title="Ventas">
            <ShoppingCart className="w-5 h-5" />
          </NavButton>
          <NavButton active={active === 'mesas'} onClick={() => ir('mesas')} title="Mesas">
            <Utensils className="w-5 h-5" />
          </NavButton>
          {puedeAccederStock && (
            <NavButton active={active === 'stock'} onClick={() => ir('stock')} title="Stock">
              <Package className="w-5 h-5" />
            </NavButton>
          )}
          {esAdministrador && (
            <NavButton active={active === 'stats'} onClick={() => ir('stats')} title="Estadísticas">
              <BarChart3 className="w-5 h-5" />
            </NavButton>
          )}
          {puedeAccederCajas && (
            <NavButton active={active === 'cajas'} onClick={() => ir('cajas')} title="Cajas">
              <Archive className="w-5 h-5" />
            </NavButton>
          )}
        </nav>

        <div className="shrink-0 flex flex-col items-center gap-2 w-full px-2 pt-3 border-t border-zinc-800">
          {puedeAccederConfiguracion && (
            <NavButton
              active={active === 'configuracion'}
              onClick={() => ir('configuracion')}
              title="Configuración"
            >
              <Settings className="w-5 h-5" />
            </NavButton>
          )}
          <button
            onClick={onLogout}
            className="w-12 h-12 shrink-0 rounded-lg flex items-center justify-center hover:bg-red-600/20 transition-colors text-zinc-400 hover:text-red-400"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-900/95 backdrop-blur-sm border-t border-zinc-800 safe-area-bottom">
        <div className="flex items-stretch justify-around h-16 max-w-lg mx-auto">
          <MobileNavItem active={active === 'home'} onClick={() => ir('home')} label="Inicio">
            <Home className="w-5 h-5" />
          </MobileNavItem>
          <MobileNavItem active={active === 'ventas'} onClick={() => ir('ventas')} label="Ventas">
            <ShoppingCart className="w-5 h-5" />
          </MobileNavItem>
          <MobileNavItem active={active === 'mesas'} onClick={() => ir('mesas')} label="Mesas">
            <Utensils className="w-5 h-5" />
          </MobileNavItem>
          {extraItems.length > 0 ? (
            <MobileNavItem
              active={extraActivo || menuAbierto}
              onClick={() => setMenuAbierto(true)}
              label="Más"
            >
              <Menu className="w-5 h-5" />
            </MobileNavItem>
          ) : (
            <MobileNavItem active={false} onClick={onLogout} label="Salir">
              <LogOut className="w-5 h-5" />
            </MobileNavItem>
          )}
        </div>
      </nav>

      {/* Menú mobile overflow */}
      {menuAbierto && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMenuAbierto(false)}
            aria-label="Cerrar menú"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 rounded-t-2xl p-4 pb-6 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 px-1">
              <p className="font-bold text-white">Más opciones</p>
              <button
                onClick={() => setMenuAbierto(false)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <div className="space-y-2">
              {extraItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => ir(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors ${
                    active === id ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="font-medium">{label}</span>
                </button>
              ))}
              <button
                onClick={() => {
                  setMenuAbierto(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-zinc-800 text-red-400 hover:bg-red-600/20 transition-colors"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                <span className="font-medium">Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
