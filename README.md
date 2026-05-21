# Club 22 - Sistema POS

Sistema de gestión y punto de venta para Club 22. **100% JavaScript** (sin TypeScript).

- **frontend/** - SPA en React 18 + Vite + Tailwind CSS v4 (recreación del diseño de Figma).
- **backend/** - API REST en Node.js + Express + Drizzle ORM con base de datos Turso (libSQL) y autenticación JWT.

## Estructura

```
centraldrinks/
├── frontend/                 # App React (Vite, JS/JSX)
│   ├── src/
│   │   ├── components/       # Login, VentaMostrador, GestionStock, etc.
│   │   ├── hooks/useAuth.jsx # Contexto de autenticación
│   │   ├── lib/api.js        # Cliente HTTP con JWT
│   │   ├── styles/           # Tailwind + theme
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── ...
├── backend/                  # API Express (JS)
│   ├── src/
│   │   ├── controllers/      # auth, usuarios, productos, mesas, ventas, cajas...
│   │   ├── models/schema.js  # Schema Drizzle (SQLite/Turso)
│   │   ├── services/         # db, jwt, hash
│   │   ├── routes/
│   │   ├── middleware/auth.js
│   │   ├── db/migrate.js     # Crea tablas
│   │   ├── db/seed.js        # Carga usuarios y datos iniciales
│   │   └── server.js
│   └── ...
└── figmacentraldrinks/       # Diseño original de Figma (referencia)
```

## Requisitos

- Node.js 20+
- Cuenta en [Turso](https://turso.tech) (gratuita) o, para desarrollo local, basta con SQLite local

## 1. Backend

### 1.1 Instalación

```bash
cd backend
npm install
cp .env.example .env
```

### 1.2 Configurar Turso (o SQLite local)

Editá `backend/.env`. Para desarrollo local SIN Turso:

```env
TURSO_DATABASE_URL=file:./local.db
TURSO_AUTH_TOKEN=
JWT_SECRET=cambia_esto_por_un_secreto_largo_y_aleatorio
JWT_EXPIRES_IN=7d
PORT=4000
CORS_ORIGIN=http://localhost:5173
```

Si querés usar Turso en la nube:

```bash
turso db create centraldrinks
turso db show centraldrinks --url        # va en TURSO_DATABASE_URL
turso db tokens create centraldrinks     # va en TURSO_AUTH_TOKEN
```

### 1.3 Migraciones y seed

```bash
npm run db:migrate   # Crea las tablas
npm run db:seed      # Carga usuarios, categorías, métodos de pago, mesas y productos demo
```

Usuarios sembrados:

| Usuario     | Contraseña | Rol           |
| ----------- | ---------- | ------------- |
| `admin`     | `admin123` | administrador |
| `empleado1` | `emp123`   | empleado      |
| `empleado2` | `emp123`   | empleado      |

### 1.4 Levantar el servidor

```bash
npm run dev    # http://localhost:4000  (con node --watch)
# o:
npm start
```

Endpoints principales (todos bajo `/api`):

- `POST /auth/login` `{ username, password }` → `{ token, user }`
- `GET  /auth/me` (Bearer token) → `{ user }`
- `GET/POST/PUT/DELETE /usuarios` (admin)
- `GET/POST/PUT/DELETE /categorias`
- `GET/POST/PUT/DELETE /metodos-pago`
- `GET/POST/PUT/DELETE /productos`
- `GET/POST/PUT/DELETE /mesas`
- `GET/POST /ventas`, `GET /ventas/:id`
- `GET /cajas`, `GET /cajas/:id`, `POST /cajas/cerrar` (admin)

## 2. Frontend

```bash
cd frontend
npm install
npm run dev    # http://localhost:5173
```

> Vite ya proxea `/api` al backend en `localhost:4000`, así que no hace falta configurar nada para desarrollo.

(Opcional) creá `frontend/.env` si querés cambiar la URL del API:

```env
VITE_API_URL=http://localhost:4000/api
```

## 3. Flujo de autenticación

1. El usuario ingresa user/pass en la pantalla de Login.
2. El frontend hace `POST /api/auth/login`.
3. El backend valida con bcrypt y firma un JWT (HS256) con `{ sub, username, rol }`.
4. El token se guarda en `localStorage` y se envía como `Authorization: Bearer <token>` en cada request.
5. El middleware `requireAuth` valida el token; `requireRole('administrador')` restringe rutas sensibles.

## 4. Funcionalidades del frontend (recreado desde Figma)

- **Login** (con JWT real contra el backend)
- **Home** con resumen y accesos rápidos
- **Venta Mostrador** (carrito, cobro dividido)
- **Venta de Mesa** y **Gestión de Mesas**
- **Gestión de Stock** (CRUD de productos con categorías)
- **Configuración** (métodos de pago, categorías)
- **Consulta de Cajas** (historial y detalle de cierres)

Permisos por rol:

- `administrador` ve todo (Stock, Cajas, Configuración).
- `empleado` solo ve Home, Ventas y Mesas.
