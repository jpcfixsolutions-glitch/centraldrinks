import { useEffect, useState } from 'react';
import { suscripcionApi } from '../lib/api.js';
import { Shield, Calendar, CheckCircle, AlertTriangle, XCircle, Save } from 'lucide-react';

function EstadoBadge({ estado, diasRestantes }) {
  if (estado === 'activa') {
    return (
      <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 border border-green-500/40 rounded-full text-green-400 text-sm font-semibold">
        <CheckCircle className="w-4 h-4" />
        Activa — {diasRestantes} días restantes
      </span>
    );
  }
  if (estado === 'por_vencer') {
    return (
      <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-400 text-sm font-semibold">
        <AlertTriangle className="w-4 h-4" />
        Por vencer — {diasRestantes} días
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500/20 border border-red-500/40 rounded-full text-red-400 text-sm font-semibold">
      <XCircle className="w-4 h-4" />
      Expirada
    </span>
  );
}

function TarjetaSucursal({ item, onGuardar }) {
  const [dia, setDia] = useState(String(item.diaVencimiento));
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleGuardar = async () => {
    const num = parseInt(dia, 10);
    if (isNaN(num) || num < 1 || num > 31) {
      setMsg({ tipo: 'error', texto: 'El día debe ser un número entre 1 y 31.' });
      return;
    }
    setGuardando(true);
    setMsg(null);
    try {
      const actualizado = await suscripcionApi.actualizar(item.sucursalId, num);
      setMsg({ tipo: 'ok', texto: `Guardado. Vence el día ${actualizado.diaVencimiento} de cada mes.` });
      onGuardar(actualizado);
    } catch (err) {
      setMsg({ tipo: 'error', texto: err.message ?? 'Error al guardar' });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-lg font-bold text-white">Sucursal ID {item.sucursalId}</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            Fecha vencimiento: {new Date(item.fechaVencimiento).toLocaleDateString('es-AR', {
              day: '2-digit', month: 'long', year: 'numeric'
            })}
          </p>
        </div>
        <EstadoBadge estado={item.estado} diasRestantes={item.diasRestantes} />
      </div>

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="block text-sm text-zinc-400 mb-1.5">
            Día de vencimiento mensual (1–31)
          </label>
          <input
            type="number"
            min={1}
            max={31}
            value={dia}
            onChange={(e) => setDia(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 focus:border-red-500 rounded-lg px-4 py-2.5 text-white focus:outline-none text-sm"
          />
        </div>
        <button
          onClick={handleGuardar}
          disabled={guardando}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg px-4 py-2.5 flex items-center gap-2 text-sm font-semibold text-white"
        >
          <Save className="w-4 h-4" />
          {guardando ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      {msg && (
        <p className={`text-sm ${msg.tipo === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
          {msg.texto}
        </p>
      )}
    </div>
  );
}

export function SuscripcionPanel({ onLogout }) {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    suscripcionApi.listar()
      .then(setDatos)
      .catch((err) => setError(err.message ?? 'Error al cargar suscripciones'))
      .finally(() => setCargando(false));
  }, []);

  const handleGuardar = (actualizado) => {
    setDatos((prev) =>
      prev.map((d) => (d.sucursalId === actualizado.sucursalId ? actualizado : d))
    );
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="border-b border-zinc-800 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Panel de Suscripciones</h1>
            <p className="text-xs text-zinc-500">Acceso exclusivo — Cuenta Creador</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="text-zinc-400 hover:text-white text-sm border border-zinc-700 hover:border-zinc-500 px-4 py-2 rounded-lg transition-colors"
        >
          Cerrar sesión
        </button>
      </header>

      <main className="flex-1 p-6 max-w-3xl w-full mx-auto space-y-6">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex items-start gap-3">
          <Calendar className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
          <p className="text-sm text-zinc-400">
            Establecé el <strong className="text-white">día fijo de vencimiento mensual</strong> para cada sucursal.
            El sistema avisará al cliente <strong className="text-white">5 días antes</strong> y bloqueará el acceso si la suscripción expira.
          </p>
        </div>

        {cargando && (
          <p className="text-zinc-500 text-sm text-center py-12">Cargando suscripciones...</p>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {!cargando && !error && datos.length === 0 && (
          <p className="text-zinc-500 text-sm text-center py-12">No hay sucursales registradas.</p>
        )}

        {datos.map((item) => (
          <TarjetaSucursal key={item.sucursalId} item={item} onGuardar={handleGuardar} />
        ))}
      </main>
    </div>
  );
}
