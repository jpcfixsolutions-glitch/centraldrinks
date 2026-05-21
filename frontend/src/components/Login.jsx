import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import { ApiError } from '../lib/api.js';

export function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const autocompletar = (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const usernameClean = username.trim();
    const passwordClean = password.trim();

    if (!usernameClean || !passwordClean) {
      setError('Por favor completa todos los campos');
      return;
    }

    setCargando(true);
    try {
      await login(usernameClean, passwordClean);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('No se pudo conectar con el servidor');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-bold text-white">C22</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Club 22</h1>
          <p className="text-zinc-400">Sistema de Gestión</p>
        </div>

        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-8">
          <h2 className="text-xl font-bold text-white mb-6">Iniciar Sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600 border border-zinc-700"
                placeholder="Ingresa tu usuario"
                autoComplete="username"
                disabled={cargando}
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">Contraseña</label>
              <div className="relative">
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-800 rounded-lg px-4 py-3 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-red-600 border border-zinc-700"
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
                  disabled={cargando}
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                >
                  {mostrarPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-600/20 border border-red-600/50 rounded-lg p-3">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors rounded-lg py-3 font-medium text-white"
            >
              {cargando ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-zinc-800">
            <p className="text-xs text-zinc-500 mb-3">Usuarios de prueba (click para autocompletar):</p>
            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => autocompletar('admin', 'admin123')}
                className="w-full bg-zinc-800 hover:bg-zinc-700 transition-colors rounded p-2 text-left"
              >
                <p className="text-zinc-400">
                  <span className="text-white font-medium">Admin:</span> admin / admin123
                </p>
              </button>
              <button
                type="button"
                onClick={() => autocompletar('empleado1', 'emp123')}
                className="w-full bg-zinc-800 hover:bg-zinc-700 transition-colors rounded p-2 text-left"
              >
                <p className="text-zinc-400">
                  <span className="text-white font-medium">Empleado:</span> empleado1 / emp123
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
