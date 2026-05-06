# Frontend - Centraldrinks

SPA en React 18 + Vite + Tailwind CSS v4. **JavaScript puro** (JSX, sin TypeScript). Recreación fiel del diseño de Figma con autenticación JWT contra el backend.

## Setup

```bash
npm install
npm run dev      # http://localhost:5173
```

> Asegurate de tener el backend corriendo en `http://localhost:4000` (Vite ya proxea `/api` automáticamente).

## Variables de entorno (opcional)

Creá `frontend/.env`:

```env
VITE_API_URL=http://localhost:4000/api
```

Si no lo definís, se usa el proxy de Vite (`/api`) hacia `localhost:4000`.

## Scripts

- `npm run dev` - servidor de desarrollo
- `npm run build` - build de producción (`dist/`)
- `npm run preview` - sirve el build

## Estructura

```
src/
├── components/        # Login.jsx, VentaMostrador.jsx, VentaMesa.jsx, GestionStock.jsx,
│                      # GestionMesas.jsx, Configuracion.jsx, ConsultaCajas.jsx, modales...
├── hooks/useAuth.jsx  # Contexto + provider de auth (JWT en localStorage)
├── lib/api.js         # apiFetch con manejo de Authorization Bearer y errores
├── styles/            # tailwind.css, theme.css, fonts.css
├── App.jsx            # Router de vistas + sidebar
└── main.jsx
```

## Usuarios de prueba (sembrados por el backend)

| Usuario     | Contraseña | Rol           |
| ----------- | ---------- | ------------- |
| `admin`     | `admin123` | administrador |
| `empleado1` | `emp123`   | empleado      |
