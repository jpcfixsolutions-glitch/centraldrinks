import { useEffect, useState } from 'react';
import { suscripcionApi } from '../lib/api.js';
import {
  Shield, Calendar, CheckCircle, AlertTriangle, XCircle,
  Save, RotateCcw, ShieldCheck,
} from 'lucide-react';

function EstadoBadge({ estado, diasRestantes }) {
  if (estado === 'activa') {
    return (
      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 border border-green-500/40 rounded-full text-green-400 text-sm font-semibold">
        <CheckCircle className="w-4 h-4" />
        Activa — {diasRestantes} día{diasRestantes !== 1 ? 's' : ''} restantes
      </span>
    );
  }
  if (estado === 'por_vencer') {
    return (
      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-400 text-sm font-semibold">
        <AlertTriangle className="w-4 h-4" />
        Por vencer — {diasRestantes} día{diasRestantes !== 1 ? 's' : ''}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 border border-red-500/40 rounded-full text-red-400 text-sm font-semibold">
      <XCircle className="w-4 h-4" />
      Expirada
    </span>
  );
}

export function SuscripcionPanel({ onLogout }) {
  const [datos, setDatos]       = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError]       = useState(null);
  const [dia, setDia]           = useState('');
  const [guardando, setGuardando]   = useState(false);
  const [reactivando, setReactivando] = useState(false);
  const [msg, setMsg]           = useState(null);

  useEffect(() => {
    suscripcionApi.obtener()
      .then((d) => { setDatos(d); setDia(String(d.diaVencimiento)); })
      .catch((err) => setError(err.message ?? 'Error al cargar'))
      .finally(() => setCargando(false));
  }, []);

  const mostrarMsg = (tipo, texto) => {
    setMsg({ tipo, texto });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleGuardar = async () => {
    const num = parseInt(dia, 10);
    if (isNaN(num) || num < 1 || num > 31) {
      mostrarMsg('error', 'El día debe ser un número entre 1 y 31.');
      return;
    }
    setGuardando(true);
    try {
      const actualizado = await suscripcionApi.actualizar(num);
      setDatos(actualizado);
      mostrarMsg('ok', `Día de corte guardado. Próxima fecha: ${fmtFecha(actualizado.fechaVencimiento)}`);
    } catch (e) {
      mostrarMsg('error', e.message ?? 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const handleReactivar = async () => {
    setReactivando(true);
    try {
      const actualizado = await suscripcionApi.reactivar();
      setDatos(actualizado);
      mostrarMsg('ok', `Servicio reactivado. Próxima fecha: ${fmtFecha(actualizado.fechaVencimiento)}`);
    } catch (e) {
      mostrarMsg('error', e.message ?? 'Error al reactivar');
    } finally {
      setReactivando(false);
    }
  };

  function fmtFecha(iso) {
    return new Date(iso).toLocaleDateString('es-AR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Navbar */}
      <nav className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <span className="text-xl font-bold">Panel de Creador</span>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-sm"
        >
          Cerrar sesión
        </button>
      </nav>

      {/* Contenido */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-6 space-y-6">

        {cargando && (
          <p className="text-slate-400 text-sm text-center py-12">Cargando suscripción...</p>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {datos && (
          <>
            {/* Estado actual */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-slate-400" />
                <h2 className="text-lg font-semibold">Estado Actual</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                  <p className="text-xs text-slate-500 mb-1">Día de corte mensual</p>
                  <p className="font-semibold">Día {datos.diaVencimiento} de cada mes</p>
                </div>
                <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                  <p className="text-xs text-slate-500 mb-1">Fecha próxima</p>
                  <p className="font-semibold text-sm">{fmtFecha(datos.fechaVencimiento)}</p>
                </div>
                <div className="bg-slate-900 rounded-lg p-4 border border-slate-700 flex flex-col gap-2">
                  <p className="text-xs text-slate-500">Estado</p>
                  <EstadoBadge estado={datos.estado} diasRestantes={datos.diasRestantes} />
                </div>
              </div>
            </div>

            {/* Cambiar día de corte */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold">Establecer Día de Corte</h2>
              <p className="text-sm text-slate-400">
                Todos los meses, en ese día, el sistema bloqueará el acceso. Los avisos empiezan
                5 días antes. Si el día ya pasó este mes, la fecha apuntará al mes siguiente.
              </p>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-sm text-slate-400 mb-1.5">
                    Día de corte mensual (1–31)
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="number"
                      min={1}
                      max={31}
                      placeholder="Ej: 10"
                      value={dia}
                      onChange={(e) => setDia(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-600 focus:border-emerald-500 rounded-lg text-white focus:outline-none text-sm"
                    />
                  </div>
                </div>
                <button
                  onClick={handleGuardar}
                  disabled={guardando}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg px-4 py-2.5 flex items-center gap-2 text-sm font-semibold text-white"
                >
                  <Save className="w-4 h-4" />
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>

            {/* Reactivar */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold">Reactivar Servicio</h2>
              <div className="bg-emerald-900/20 border border-emerald-700/40 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-emerald-200">Renovar suscripción del cliente</p>
                  <p className="text-sm text-emerald-400/80 mt-1">
                    Avanza la fecha de vencimiento un mes hacia adelante y levanta el bloqueo.
                  </p>
                </div>
                <button
                  onClick={handleReactivar}
                  disabled={reactivando}
                  className="shrink-0 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg px-5 py-2.5 flex items-center gap-2 text-sm font-semibold text-white"
                >
                  <RotateCcw className="w-4 h-4" />
                  {reactivando ? 'Reactivando...' : 'Reactivar'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Feedback */}
        {msg && (
          <div className={`rounded-lg px-4 py-3 text-sm font-medium ${
            msg.tipo === 'ok'
              ? 'bg-emerald-900/30 border border-emerald-700 text-emerald-300'
              : 'bg-red-900/30 border border-red-700 text-red-300'
          }`}>
            {msg.texto}
          </div>
        )}

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4 flex items-start gap-3">
          <Shield className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500">
            Panel de acceso exclusivo. Esta sección no es visible para administradores ni empleados.
          </p>
        </div>
      </main>
    </div>
  );
}
