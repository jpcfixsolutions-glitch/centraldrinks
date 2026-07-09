import { useState, useMemo } from 'react';
import {
  ArrowLeft, TrendingUp, TrendingDown, DollarSign, CreditCard, Wallet,
  Receipt, Activity, Plus, X, List, Package, RefreshCw, History, ChevronDown, ChevronUp,
} from 'lucide-react';
import { formatearFechaHora, parseFechaDB, fechaLocalClave } from '../lib/fechas.js';

// ── Helpers de fecha ────────────────────────────────────────────────────────

/** Lunes de la semana que contiene `date` (00:00:00 hora local) */
function getLunesDeDate(date) {
  const d = new Date(date);
  const diasDesdeElLunes = d.getDay() === 0 ? 6 : d.getDay() - 1;
  d.setDate(d.getDate() - diasDesdeElLunes);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getInicioSemanaActual() {
  return getLunesDeDate(new Date());
}

function getInicioMesActual() {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth(), 1, 0, 0, 0, 0);
}

/** Clave YYYY-MM (mes calendario) */
function claveMes(date) {
  const d = parseFechaDB(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Clave ISO del lunes de esa semana */
function claveSemana(date) {
  return getLunesDeDate(parseFechaDB(date)).toISOString().slice(0, 10);
}

/** Label legible para un mes (YYYY-MM → "Ene 2026") */
function labelMes(clave) {
  const [y, m] = clave.split('-');
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${meses[parseInt(m, 10) - 1]} ${y}`;
}

/** Label legible para una semana (ISO lunes → "23/06 – 29/06") */
function labelSemana(claveISO) {
  const lunes = new Date(claveISO + 'T00:00:00');
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  const fmt = (d) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
  return `${fmt(lunes)} – ${fmt(domingo)}`;
}

/** Agrupa ventas y gastos por una clave dada. Retorna mapa { clave → { total, gastosMonto, movimientos } } */
function agruparPorClave(ventas, gastos, fnClave, fnClaveG) {
  const grupos = {};
  ventas.forEach((v) => {
    const k = fnClave(v.fecha);
    if (!grupos[k]) grupos[k] = { total: 0, gastosMonto: 0, movimientos: [] };
    grupos[k].total += v.total;
    grupos[k].movimientos.push({ tipo: 'ingreso', fecha: v.fecha, asunto: `Venta #${v.codigo || v.id}`, monto: v.total, metodo: v.metodoPago });
  });
  gastos.forEach((g) => {
    const k = (fnClaveG || fnClave)(g.fecha);
    if (!grupos[k]) grupos[k] = { total: 0, gastosMonto: 0, movimientos: [] };
    grupos[k].gastosMonto += g.monto;
    grupos[k].movimientos.push({ tipo: 'egreso', fecha: g.fecha, asunto: g.asunto, monto: g.monto, metodo: g.metodo });
  });
  Object.values(grupos).forEach((g) => g.movimientos.sort((a, b) => parseFechaDB(b.fecha) - parseFechaDB(a.fecha)));
  return grupos;
}

// ── Gráfico de barras SVG ────────────────────────────────────────────────────

function GraficoBarras({ ventas, rangoTiempo }) {
  const datos = useMemo(() => {
    const hoy = new Date();

    if (rangoTiempo === 'semana') {
      const lunes = getInicioSemanaActual();
      const dias = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(lunes);
        d.setDate(lunes.getDate() + i);
        dias.push(d);
      }
      const LABELS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
      return dias.map((d, i) => {
        const clave = d.toISOString().slice(0, 10).replace('T', ' ').slice(0, 10);
        const total = ventas
          .filter((v) => fechaLocalClave(v.fecha) === d.toISOString().slice(0, 10))
          .reduce((s, v) => s + v.total, 0);
        return { label: LABELS[i], value: total, esFuturo: d > hoy };
      });
    }

    if (rangoTiempo === 'mes') {
      const inicio = getInicioMesActual();
      const dias = [];
      const d = new Date(inicio);
      while (d <= hoy) {
        dias.push(new Date(d));
        d.setDate(d.getDate() + 1);
      }
      return dias.map((d) => {
        const clave = d.toISOString().slice(0, 10);
        const total = ventas
          .filter((v) => fechaLocalClave(v.fecha) === clave)
          .reduce((s, v) => s + v.total, 0);
        return { label: String(d.getDate()), value: total, esFuturo: false };
      });
    }

    // todo: agrupar por mes
    const porMes = {};
    ventas.forEach((v) => {
      const k = claveMes(v.fecha);
      porMes[k] = (porMes[k] || 0) + v.total;
    });
    return Object.entries(porMes)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, value]) => ({ label: labelMes(k), value }));
  }, [ventas, rangoTiempo]);

  if (!datos.length) return null;

  const maxVal = Math.max(...datos.map((d) => d.value), 1);

  return (
    <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-green-500" />
        </div>
        <h2 className="text-lg font-bold">Evolución de Ingresos</h2>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: datos.length > 20 ? `${datos.length * 28}px` : '100%' }}>
          <div className="flex items-end gap-1" style={{ height: 120 }}>
            {datos.map((d, i) => {
              const pct = maxVal > 0 ? (d.value / maxVal) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative min-w-[18px]">
                  <div className="absolute bottom-6 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                    <div className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white whitespace-nowrap">
                      ${d.value.toLocaleString()}
                    </div>
                    <div className="w-2 h-2 bg-zinc-800 rotate-45 -mt-1 border-r border-b border-zinc-700" />
                  </div>
                  <div
                    className={`w-full rounded-t transition-all ${
                      d.esFuturo
                        ? 'bg-zinc-700'
                        : d.value > 0
                        ? 'bg-green-500/80 hover:bg-green-400'
                        : 'bg-zinc-800 hover:bg-zinc-700'
                    }`}
                    style={{ height: `${Math.max(pct, d.value > 0 ? 4 : 0)}%` }}
                  />
                  <span className="text-[9px] text-zinc-500 truncate w-full text-center">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sección Histórico ────────────────────────────────────────────────────────

function FilaPeriodo({ label, total, gastosMonto, movimientos }) {
  const [abierto, setAbierto] = useState(false);
  const balance = total - gastosMonto;
  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setAbierto((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-zinc-900/60 hover:bg-zinc-800/60 transition-colors"
      >
        <div className="flex items-center gap-4 text-sm">
          <span className="font-semibold text-white">{label}</span>
          <span className="text-green-400">+${total.toLocaleString()}</span>
          {gastosMonto > 0 && <span className="text-red-400">-${gastosMonto.toLocaleString()}</span>}
          <span className={`font-bold ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            = ${balance.toLocaleString()}
          </span>
        </div>
        {abierto ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
      </button>

      {abierto && (
        <div className="divide-y divide-zinc-800/60 bg-zinc-950/40 max-h-64 overflow-y-auto">
          {movimientos.length === 0 && (
            <p className="px-5 py-4 text-zinc-500 text-sm">Sin movimientos.</p>
          )}
          {movimientos.map((m, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-2.5">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                  m.tipo === 'ingreso' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                }`}>
                  {m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                </span>
                <span className="text-sm text-zinc-300 truncate">{m.asunto}</span>
                <span className="text-xs text-zinc-600 shrink-0">{m.metodo}</span>
              </div>
              <span className={`text-sm font-semibold shrink-0 ml-4 ${m.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400'}`}>
                {m.tipo === 'ingreso' ? '+' : '-'}${m.monto.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Historico({ ventas, gastos }) {
  const [vistaH, setVistaH] = useState('mes'); // 'mes' | 'semana'

  const { porMes, porSemana } = useMemo(() => {
    const hoy = new Date();
    const inicioMesActual = getInicioMesActual();
    const inicioSemanaActual = getInicioSemanaActual();

    // Ventas y gastos pasados (excluye el período actual)
    const ventasH = ventas.filter((v) => parseFechaDB(v.fecha) < inicioMesActual);
    const gastosHMes = gastos.filter((g) => parseFechaDB(g.fecha) < inicioMesActual);
    const ventasHSem = ventas.filter((v) => parseFechaDB(v.fecha) < inicioSemanaActual);
    const gastosHSem = gastos.filter((g) => parseFechaDB(g.fecha) < inicioSemanaActual);

    const mes = agruparPorClave(ventasH, gastosHMes, claveMes);
    const sem = agruparPorClave(ventasHSem, gastosHSem, claveSemana);

    return { porMes: mes, porSemana: sem };
  }, [ventas, gastos]);

  const entradas = vistaH === 'mes'
    ? Object.entries(porMes).sort(([a], [b]) => b.localeCompare(a))
    : Object.entries(porSemana).sort(([a], [b]) => b.localeCompare(a));

  const labelFn = vistaH === 'mes' ? labelMes : labelSemana;

  return (
    <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden mb-8">
      <div className="p-6 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <History className="w-4 h-4 text-violet-400" />
          </div>
          <h2 className="text-lg font-bold">Histórico</h2>
        </div>
        <div className="flex bg-zinc-800 rounded-lg p-0.5">
          <button
            onClick={() => setVistaH('mes')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              vistaH === 'mes' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Por Mes
          </button>
          <button
            onClick={() => setVistaH('semana')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              vistaH === 'semana' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Por Semana
          </button>
        </div>
      </div>

      <div className="p-4 space-y-2 max-h-[480px] overflow-y-auto">
        {entradas.length === 0 && (
          <p className="text-zinc-500 text-sm text-center py-8">
            No hay períodos pasados registrados todavía.
          </p>
        )}
        {entradas.map(([clave, data]) => (
          <FilaPeriodo
            key={clave}
            label={labelFn(clave)}
            total={data.total}
            gastosMonto={data.gastosMonto}
            movimientos={data.movimientos}
          />
        ))}
      </div>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────

export function Stats({ onVolver, ventas, gastosFijos = [], gastos = [], productos = [], onCrearGasto }) {
  const [rangoTiempo, setRangoTiempo] = useState('mes');
  const [showGastoModal, setShowGastoModal] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const totalInvertido = useMemo(
    () => productos.reduce((sum, p) => sum + (p.stock * (p.costoUnitario || 0)), 0),
    [productos]
  );

  const { fechaInicio, labelPeriodo } = useMemo(() => {
    if (rangoTiempo === 'semana') {
      const f = getInicioSemanaActual();
      return { fechaInicio: f, labelPeriodo: 'esta semana (desde el lunes)' };
    }
    if (rangoTiempo === 'mes') {
      const f = getInicioMesActual();
      return { fechaInicio: f, labelPeriodo: 'este mes (desde el 1°)' };
    }
    return { fechaInicio: null, labelPeriodo: 'todos los registros' };
  }, [rangoTiempo]);

  const {
    ingresosTotales, ingresosEfectivo, ingresosVirtuales,
    gastosFijosMensuales, gastosVariables, gastosOperativos,
    costoReposicion, movimientos,
  } = useMemo(() => {
    const ventasFiltradas = fechaInicio
      ? ventas.filter((v) => parseFechaDB(v.fecha) >= fechaInicio)
      : ventas;
    const gastosFiltrados = fechaInicio
      ? gastos.filter((g) => parseFechaDB(g.fecha) >= fechaInicio)
      : gastos;

    let total = 0, efectivo = 0, virtual = 0, reposicion = 0;

    ventasFiltradas.forEach((v) => {
      total += v.total;
      const esEfectivo = v.metodoPago?.toLowerCase() === 'efectivo';
      if (esEfectivo) efectivo += v.total; else virtual += v.total;
      const items = v.productos || v.items || [];
      items.forEach((vp) => {
        const prodOriginal = productos.find((p) => p.nombre === (vp.nombre || vp.nombreProducto));
        reposicion += (prodOriginal?.costoUnitario || 0) * vp.cantidad;
      });
    });

    const gastosEfectivo = gastosFiltrados.filter((g) => g.metodo === 'Efectivo').reduce((s, g) => s + g.monto, 0);
    const gastosVirtuales = gastosFiltrados.filter((g) => g.metodo === 'Virtual').reduce((s, g) => s + g.monto, 0);
    const totalGastosFijosMes = gastosFijos.reduce((s, g) => s + g.monto, 0);
    const gastosOp = gastosEfectivo + gastosVirtuales + (rangoTiempo !== 'todo' ? totalGastosFijosMes : 0);

    const movsCombinados = [
      ...ventasFiltradas.map((v) => ({
        id: `v-${v.id}`,
        fechaOriginal: parseFechaDB(v.fecha),
        tipo: 'ingreso',
        asunto: `Venta ${v.tipo === 'mostrador' ? 'Mostrador' : 'Mesa'} #${v.codigo || v.id}`,
        metodo: v.metodoPago,
        monto: v.total,
      })),
      ...gastosFiltrados.map((g) => ({
        id: `g-${g.id}`,
        fechaOriginal: parseFechaDB(g.fecha),
        tipo: 'egreso',
        asunto: g.asunto,
        metodo: g.metodo,
        monto: g.monto,
      })),
    ].sort((a, b) => b.fechaOriginal - a.fechaOriginal);

    return {
      ingresosTotales: total,
      ingresosEfectivo: efectivo,
      ingresosVirtuales: virtual,
      gastosFijosMensuales: gastosFijos.reduce((s, g) => s + g.monto, 0),
      gastosVariables: gastosEfectivo + gastosVirtuales,
      gastosOperativos: gastosOp,
      costoReposicion: reposicion,
      movimientos: movsCombinados,
    };
  }, [ventas, gastos, gastosFijos, productos, rangoTiempo, fechaInicio]);

  const handleGuardarGasto = async (nuevoGasto) => {
    setGuardando(true);
    try {
      await onCrearGasto(nuevoGasto);
      setShowGastoModal(false);
    } catch (err) {
      alert(err.message || 'Error al guardar el gasto');
    } finally {
      setGuardando(false);
    }
  };

  const TABS = [
    { key: 'todo',   label: 'Todo' },
    { key: 'semana', label: 'Semana' },
    { key: 'mes',    label: 'Mes' },
  ];

  return (
    <div className="flex-1 flex flex-col bg-black text-white">
      {/* Header */}
      <header className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 border-b border-zinc-800 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button onClick={onVolver} className="hover:bg-zinc-800 p-2 rounded-lg transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold">Estadísticas</h1>
            <p className="text-sm text-zinc-500 mt-0.5 capitalize">{labelPeriodo}</p>
          </div>
        </div>
        <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800 w-full sm:w-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setRangoTiempo(tab.key)}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                rangoTiempo === tab.key ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">

        {/* Tarjetas principales */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Ingresos */}
          <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <TrendingUp className="w-24 h-24 text-green-500" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h2 className="text-lg font-bold relative z-10">Ingresos Totales</h2>
            </div>
            <p className="text-4xl font-bold text-green-500 mb-6 relative z-10">
              ${ingresosTotales.toLocaleString()}
            </p>
            <div className="space-y-3 relative z-10">
              <div className="flex justify-between items-center bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Wallet className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm">Efectivo</span>
                </div>
                <span className="font-bold text-emerald-500">${ingresosEfectivo.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
                <div className="flex items-center gap-2 text-zinc-300">
                  <CreditCard className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Virtual (Transf, Tarjetas, QR)</span>
                </div>
                <span className="font-bold text-blue-500">${ingresosVirtuales.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Gastos */}
          <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <TrendingDown className="w-24 h-24 text-red-500" />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                </div>
                <h2 className="text-lg font-bold relative z-10">Gastos Operativos</h2>
              </div>
              <button
                onClick={() => setShowGastoModal(true)}
                className="relative z-10 bg-red-600 hover:bg-red-700 transition-colors w-8 h-8 rounded-lg flex items-center justify-center"
                title="Registrar gasto"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <p className="text-4xl font-bold text-red-500 mb-6 relative z-10">
              ${gastosOperativos.toLocaleString()}
            </p>
            <div className="space-y-3 relative z-10">
              {rangoTiempo !== 'todo' && (
                <div className="flex justify-between items-center bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Receipt className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm">Gastos Fijos (Mes)</span>
                  </div>
                  <span className="font-medium text-white">${gastosFijosMensuales.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
                <div className="flex items-center gap-2 text-zinc-300">
                  <DollarSign className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm">Gastos Variables / Retiros</span>
                </div>
                <span className="font-medium text-white">${gastosVariables.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Balance */}
          <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Activity className="w-24 h-24 text-purple-500" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-purple-500" />
                </div>
                <h2 className="text-lg font-bold relative z-10">Balance Neto</h2>
              </div>
              <p className="text-zinc-400 text-sm mb-2 relative z-10">Ingresos − Gastos Operativos</p>
            </div>
            <div className="relative z-10 bg-zinc-800/50 p-4 rounded-lg border border-zinc-700/50 text-center">
              <p className={`text-4xl font-bold ${ingresosTotales - gastosOperativos >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${(ingresosTotales - gastosOperativos).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Gráfico evolución */}
        <GraficoBarras ventas={ventas} rangoTiempo={rangoTiempo} />

        {/* Capital e Inventario */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Package className="w-24 h-24 text-amber-500" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold relative z-10">Capital Invertido</h2>
                <p className="text-xs text-zinc-500">Costo de la mercadería en stock</p>
              </div>
            </div>
            <p className="text-4xl font-bold text-amber-500 relative z-10">${totalInvertido.toLocaleString()}</p>
          </div>

          <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <RefreshCw className="w-24 h-24 text-cyan-500" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-cyan-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold relative z-10">Costo de Reposición</h2>
                <p className="text-xs text-zinc-500">
                  {rangoTiempo === 'semana' ? 'Esta semana' : rangoTiempo === 'mes' ? 'Este mes' : 'Total'}
                </p>
              </div>
            </div>
            <p className="text-4xl font-bold text-cyan-500 relative z-10">${costoReposicion.toLocaleString()}</p>
          </div>
        </div>

        {/* Histórico */}
        <Historico ventas={ventas} gastos={gastos} />

        {/* Historial de movimientos del período actual */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <List className="w-4 h-4 text-blue-500" />
            </div>
            <h2 className="text-lg font-bold">Movimientos del Período</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="text-left px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wide">Fecha y Hora</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wide">Detalle</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wide">Método</th>
                  <th className="text-right px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wide">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {movimientos.map((mov) => (
                  <tr key={mov.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 text-zinc-400 text-sm">{formatearFechaHora(mov.fechaOriginal)}</td>
                    <td className="px-6 py-4 font-medium text-white">{mov.asunto}</td>
                    <td className="px-6 py-4 text-sm text-zinc-400 uppercase">{mov.metodo}</td>
                    <td className="px-6 py-4 text-right">
                      {mov.tipo === 'ingreso'
                        ? <span className="text-green-500 font-bold">+${mov.monto.toLocaleString()}</span>
                        : <span className="text-red-500 font-bold">-${mov.monto.toLocaleString()}</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {movimientos.length === 0 && (
              <div className="text-center py-12 text-zinc-500">No hay registros para este período.</div>
            )}
          </div>
        </div>
      </div>

      {showGastoModal && (
        <ModalNuevoGasto
          isOpen={showGastoModal}
          onClose={() => setShowGastoModal(false)}
          onGuardar={handleGuardarGasto}
          guardando={guardando}
        />
      )}
    </div>
  );
}

// ── Modal gasto ──────────────────────────────────────────────────────────────

function ModalNuevoGasto({ isOpen, onClose, onGuardar, guardando = false }) {
  const [asunto, setAsunto] = useState('');
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState('Efectivo');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!asunto.trim() || !monto) { alert('Completá todos los campos'); return; }
    await onGuardar({ asunto: asunto.trim(), monto: parseFloat(monto), metodo });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold">Registrar Gasto</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Asunto / Descripción</label>
            <input
              type="text" value={asunto} onChange={(e) => setAsunto(e.target.value)}
              className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600 border border-zinc-700"
              placeholder="Ej: Pago de alquiler, Insumos, etc." autoFocus
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Monto ($)</label>
              <input
                type="number" value={monto} onChange={(e) => setMonto(e.target.value)}
                className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600 border border-zinc-700"
                placeholder="0" min="1" step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Forma de Pago</label>
              <select
                value={metodo} onChange={(e) => setMetodo(e.target.value)}
                className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600 border border-zinc-700"
              >
                <option value="Efectivo">Efectivo (Caja)</option>
                <option value="Virtual">Virtual (Transferencia)</option>
              </select>
            </div>
          </div>
          <button
            type="submit" disabled={guardando}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors rounded-lg py-4 font-medium mt-4"
          >
            {guardando ? 'Guardando...' : 'Guardar Movimiento'}
          </button>
        </form>
      </div>
    </div>
  );
}
