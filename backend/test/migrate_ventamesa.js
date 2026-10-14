import fs from 'fs';
import crypto from 'crypto';

let content = fs.readFileSync('frontend/src/components/VentaMesa.jsx', 'utf-8');

// 1. Update AgregarProductoMesaModal to just pass the product, and VentaMesa will assign uid and estado='pendiente'.
content = content.replace("const existente = prev.find((p) => p.id === producto.id);", 
"const existente = prev.find((p) => p.id === producto.id && p.estado === 'pendiente');");

content = content.replace("return [...prev, { ...producto, cantidad: 1 }];",
"return [...prev, { ...producto, cantidad: 1, estado: 'pendiente', uid: crypto.randomUUID(), ronda: null, observaciones: '' }];");

content = content.replace("const aumentarCantidad = (id) => {", "const aumentarCantidad = (uid, id) => {");
content = content.replace("const itemCarrito = carrito.find((p) => p.id === id);", "const itemCarrito = carrito.find((p) => p.uid === uid);");
content = content.replace("p.id === id ? { ...p, cantidad: p.cantidad + 1 } : p", "p.uid === uid ? { ...p, cantidad: p.cantidad + 1 } : p");
content = content.replace("disminuirCantidad(producto.id)", "disminuirCantidad(producto.uid)");
content = content.replace("aumentarCantidad(producto.id)", "aumentarCantidad(producto.uid, producto.id)");
content = content.replace("const disminuirCantidad = (id) => {", "const disminuirCantidad = (uid) => {");
content = content.replace("const producto = prev.find((p) => p.id === id);", "const producto = prev.find((p) => p.uid === uid);");
content = content.replace("p.id === id ? { ...p, cantidad: p.cantidad - 1 } : p", "p.uid === uid ? { ...p, cantidad: p.cantidad - 1 } : p");
content = content.replace("p.id !== id", "p.uid !== uid");
content = content.replace("const eliminarProducto = (id) => {", "const eliminarProducto = (uid) => {");
content = content.replace("eliminarProducto(producto.id)", "eliminarProducto(producto.uid)");

const enviar_cocina = `
  const handleEnviarCocina = () => {
    const pendientes = carrito.filter(p => p.estado === 'pendiente');
    if (pendientes.length === 0) return;
    const maxRonda = Math.max(0, ...carrito.map(p => p.ronda || 0));
    const nuevaRonda = maxRonda + 1;
    const ahora = new Date().toISOString();
    setCarrito(prev => prev.map(p => p.estado === 'pendiente' ? { ...p, estado: 'enviado', ronda: nuevaRonda, fecha_envio: ahora } : p));
  };

  const handleCancelarItem = (uid) => {
    setCarrito(prev => prev.map(p => p.uid === uid ? { ...p, estado: 'cancelado' } : p));
  };
`;
content = content.replace("const totalMesa =", enviar_cocina + "\n  const totalMesa =");

content = content.replace("const totalMesa = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);",
"const totalMesa = carrito.filter(i => i.estado !== 'cancelado').reduce((sum, item) => sum + item.precio * item.cantidad, 0);");

const render_item = `
                  return (
                  <div key={producto.uid || producto.id} className={\`bg-zinc-800 rounded-lg p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between \${producto.estado === 'cancelado' ? 'opacity-50' : ''}\`}>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{producto.nombre} {producto.estado !== 'pendiente' && \`(\${producto.estado.toUpperCase()})\`}</p>
                      <p className="text-sm text-zinc-400">{producto.categoria}</p>
                      {producto.ronda && <p className="text-xs text-blue-400">Ronda {producto.ronda}</p>}
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto">
                      <div className="flex items-center gap-2 bg-zinc-700 rounded-lg shrink-0">
                        <button
                          onClick={() => disminuirCantidad(producto.uid)}
                          disabled={producto.estado !== 'pendiente'}
                          className="p-2 hover:bg-zinc-600 rounded-l-lg transition-colors disabled:opacity-40"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-3 min-w-[2rem] text-center">{producto.cantidad}</span>
                        <button
                          onClick={() => aumentarCantidad(producto.uid, producto.id)}
                          disabled={alMaximoStock || producto.estado !== 'pendiente'}
                          className="p-2 hover:bg-zinc-600 rounded-r-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-red-500 font-medium w-24 text-right">
                        \${(producto.precio * producto.cantidad).toLocaleString()}
                      </p>
                      {producto.estado === 'pendiente' ? (
                        <button
                          onClick={() => eliminarProducto(producto.uid)}
                          className="p-2 hover:bg-red-600/20 rounded-lg transition-colors text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : producto.estado !== 'cancelado' ? (
                        <button
                          onClick={() => handleCancelarItem(producto.uid)}
                          title="Cancelar ítem"
                          className="p-2 hover:bg-orange-600/20 rounded-lg transition-colors text-orange-500"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      ) : null}
                    </div>
                  </div>
`;
content = content.replace(/<div key=\{producto\.id\}.*?<\/div>\s*<\/div>\s*\);\s*\}\)/s, render_item + ');\n                })');

const enviar_btn = `
            <button
              onClick={handleEnviarCocina}
              disabled={!carrito.some(p => p.estado === 'pendiente')}
              className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 disabled:opacity-50 transition-colors px-4 sm:px-6 py-3 rounded-lg flex items-center justify-center gap-2"
            >
              Enviar a Cocina
            </button>
            <button
`;
content = content.replace('<button\n            onClick={() => setShowAgregarModal(true)}', enviar_btn + '            onClick={() => setShowAgregarModal(true)}');

const cierre_check = `
  const handleCerrarMesa = () => {
    if (carrito.length === 0) {
      alert('No hay productos para cobrar');
      return;
    }
    const noTerminados = carrito.filter(p => !['entregado', 'cancelado', 'pendiente'].includes(p.estado));
    if (noTerminados.length > 0) {
      alert('Hay ítems que aún no fueron entregados por cocina. No se puede cobrar.');
      return;
    }
    setShowCerrarMesaModal(true);
  };
`;
content = content.replace(/const handleCerrarMesa = \(\) => \{.*?\};/s, cierre_check);

content = content.replace("items: carrito.map((p) => ({", "items: carrito.filter(p => p.estado !== 'cancelado').map((p) => ({");

fs.writeFileSync('frontend/src/components/VentaMesa.jsx', content, 'utf-8');
