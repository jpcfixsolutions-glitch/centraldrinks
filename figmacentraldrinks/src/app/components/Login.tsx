import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface Usuario {
  username: string;
  password: string;
  rol: 'administrador' | 'empleado';
  nombre: string;
}

interface LoginProps {
  onLogin: (usuario: Usuario) => void;
}

// Usuarios de ejemplo (en producción esto vendría de una base de datos)
const usuariosDemo: Usuario[] = [
  {
    username: 'admin',
    password: 'admin123',
    rol: 'administrador',
    nombre: 'Administrador'
  },
  {
    username: 'empleado1',
    password: 'emp123',
    rol: 'empleado',
    nombre: 'Empleado #1'
  },
  {
    username: 'empleado2',
    password: 'emp123',
    rol: 'empleado',
    nombre: 'Empleado #2'
  }
];

export function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');

  const autocompletar = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Limpiar espacios en blanco
    const usernameClean = username.trim();
    const passwordClean = password.trim();

    // Validar campos vacíos
    if (!usernameClean || !passwordClean) {
      setError('Por favor completa todos los campos');
      return;
    }

    const usuario = usuariosDemo.find(
      u => u.username === usernameClean && u.password === passwordClean
    );

    if (usuario) {
      onLogin(usuario);
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-bold text-white">CD</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Centraldrinks</h1>
          <p className="text-zinc-400">Sistema de Gestión</p>
        </div>

        {/* Formulario de Login */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-8">
          <h2 className="text-xl font-bold text-white mb-6">Iniciar Sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Usuario */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-600 border border-zinc-700"
                placeholder="Ingresa tu usuario"
                autoComplete="username"
              />
            </div>

            {/* Contraseña */}
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
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                >
                  {mostrarPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-600/20 border border-red-600/50 rounded-lg p-3">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            {/* Botón Ingresar */}
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 transition-colors rounded-lg py-3 font-medium text-white"
            >
              Ingresar
            </button>
          </form>

          {/* Usuarios de prueba */}
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
