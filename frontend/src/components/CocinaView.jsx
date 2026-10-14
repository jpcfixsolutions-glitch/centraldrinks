import { useState, useEffect } from 'react';
import { ArrowLeft, Check, CheckCircle2, Clock } from 'lucide-react';
import { mesaCuentasApi } from '../lib/api.js';

export function CocinaView({ onVolver, sucursalId }) {
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCuentas = async () => {
    try {
      const res = await mesaCuentasApi.listar();
      setCuentas(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCuentas();
    const interval = setInterval(fetchCuentas, 4000);
    return () => clearInterval(interval);
  }, []);

  const cambiarEstado = async (numeroMesa, data) => {
    try {
      await mesaCuentasApi.transicionarItems(numeroMesa, data);
      await fetchCuentas();
    } catch (error) {
      alert(error.message || 'No se pudo actualizar la comanda');
    }
  };

  const handleMarcarListo = (numeroMesa, uid) =>
    cambiarEstado(numeroMesa, { accion: 'listo', uids: [uid] });

  const handleRecibirRonda = (numeroMesa, ronda) =>
    cambiarEstado(numeroMesa, { accion: 'recibir', ronda });

  const handleMarcarRondaLista = (numeroMesa, ronda) =>
    cambiarEstado(numeroMesa, { accion: 'listo', ronda });

  // Agrupar items "enviados" por (mesa, ronda)
  const tickets = [];
  cuentas.forEach(cuenta => {
    const enviados = cuenta.items.filter(i => i.estado === 'enviado');
    const porRonda = {};
    enviados.forEach(i => {
      if (!porRonda[i.ronda]) porRonda[i.ronda] = [];
      porRonda[i.ronda].push(i);
    });

    Object.keys(porRonda).forEach(ronda => {
      tickets.push({
        numeroMesa: cuenta.numeroMesa,
        nombreCliente: cuenta.nombreCliente,
        ronda: Number(ronda),
        items: porRonda[ronda],
        fechaEnvio: porRonda[ronda][0]?.fecha_envio || new Date().toISOString()
      });
    });
  });

  tickets.sort((a, b) => new Date(a.fechaEnvio) - new Date(b.fechaEnvio));

  return (
    <div className="flex-1 flex flex-col bg-black text-white h-screen overflow-hidden">
      <header className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 border-b border-zinc-800 flex items-center gap-4 bg-zinc-900">
        <button onClick={onVolver} className="hover:bg-zinc-800 p-2 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-orange-500">Vista de Cocina</h1>
      </header>
      
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full text-zinc-500">Cargando comandas...</div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <CheckCircle2 className="w-16 h-16 mb-4 text-zinc-700" />
            <p className="text-xl font-medium">No hay pedidos pendientes</p>
          </div>
        ) : (
          <div className="flex gap-6 h-full items-start">
            {tickets.map((ticket, idx) => {
              const minutosTranscurridos = Math.floor((new Date() - new Date(ticket.fechaEnvio)) / 60000);
              const colorHeader = minutosTranscurridos > 15 ? 'bg-red-900/80 border-red-500' : 'bg-zinc-800 border-zinc-700';

              return (
                <div key={`${ticket.numeroMesa}-${ticket.ronda}`} className="w-80 flex-shrink-0 bg-zinc-900 rounded-xl border border-zinc-800 flex flex-col h-full max-h-full shadow-xl overflow-hidden">
                  <div className={`p-4 border-b ${colorHeader} flex flex-col gap-1`}>
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-bold text-white">Mesa {ticket.numeroMesa}</h2>
                      <span className="bg-orange-500 text-black text-xs font-bold px-2 py-1 rounded-full">Ronda {ticket.ronda}</span>
                    </div>
                    {ticket.nombreCliente && <p className="text-sm font-medium text-zinc-300">Cliente: {ticket.nombreCliente}</p>}
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                      <Clock className="w-3.5 h-3.5" />
                      Hace {minutosTranscurridos} min
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {ticket.items.map(item => (
                      <div key={item.uid} className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50 flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-lg leading-tight">
                            <span className="text-orange-400 font-black mr-2">{item.cantidad}x</span>
                            {item.nombre}
                          </p>
                          <button 
                            onClick={() => handleMarcarListo(ticket.numeroMesa, item.uid)}
                            className="bg-green-600 hover:bg-green-500 p-2 rounded-lg transition-colors shrink-0"
                            title="Marcar como listo"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                        {item.observaciones && (
                          <p className="text-sm text-yellow-500 bg-yellow-500/10 p-2 rounded italic">
                            Nota: {item.observaciones}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-zinc-800 border-t border-zinc-700 mt-auto">
                    {!ticket.items.every((item) => item.recibidoCocina) && (
                      <button
                        onClick={() => handleRecibirRonda(ticket.numeroMesa, ticket.ronda)}
                        className="w-full mb-2 bg-blue-600 hover:bg-blue-500 transition-colors px-4 py-2 rounded-lg font-medium"
                      >
                        Recibir ronda
                      </button>
                    )}
                    <button
                      onClick={() => handleMarcarRondaLista(ticket.numeroMesa, ticket.ronda)}
                      className="w-full bg-green-600 hover:bg-green-500 transition-colors px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Ronda Lista
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
