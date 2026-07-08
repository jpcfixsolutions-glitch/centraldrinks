# Backend - Club 22

API REST con Express + Drizzle ORM + Turso (libSQL) + JWT. **JavaScript puro** (sin TypeScript).

## Setup rápidoo

```bash
npm install
cp .env.example .env       # editá tus credenciales o usá file:./local.db
npm run db:migrate         # crea tablas + datos iniciales (ejecuta src/db/schema.sql)
npm run dev
```

El servidor queda en `http://localhost:4000`.

> Si preferís ejecutar el SQL a mano en Turso:
> `turso db shell centraldrinks < src/db/schema.sql`

## Scripts

- `npm run dev` - desarrollo con `node --watch` (recarga al guardar)
- `npm start` - corre el server
- `npm run db:migrate` - **ejecuta `src/db/schema.sql`**: crea todas las tablas, índices y datos iniciales (usuarios, categorías, métodos de pago, mesas, productos demo)
- `npm run db:seed` - opcional: regenera los hashes de contraseñas desde JS y verifica datos (idempotente)

## Estructura

```
src/
├── controllers/      # lógica de cada recurso (auth, usuarios, productos, ventas, cajas...)
├── models/schema.js  # tablas Drizzle
├── services/         # db.js, jwt.js, hash.js
├── middleware/auth.js
├── routes/           # definición de endpoints REST
├── utils/asyncHandler.js
├── db/migrate.js     # crea tablas
├── db/seed.js        # datos iniciales
└── server.js
```

## Endpoints

Todas las rutas están bajo `/api`. Salvo `/auth/login`, requieren `Authorization: Bearer <token>`.

### Auth

| Método | Ruta | Body | Descripción |
| --- | --- | --- | --- |
| POST | `/auth/login` | `{ username, password }` | Devuelve `{ token, user }` |
| GET | `/auth/me` | - | Datos del usuario autenticado |

### Recursos

- `GET/POST/PUT/DELETE /usuarios` (admin)
- `GET/POST/PUT/DELETE /categorias` (admin para escritura)
- `GET/POST/PUT/DELETE /metodos-pago` (admin para escritura)
- `GET/POST/PUT/DELETE /productos` (admin para escritura)
- `GET/POST/PUT/DELETE /mesas` (admin para crear/eliminar)
- `GET/POST /ventas`, `GET /ventas/:id`
- `GET /cajas`, `GET /cajas/:id`, `POST /cajas/cerrar` (admin)

## Variables de entorno

Ver `.env.example`:

- `TURSO_DATABASE_URL` (obligatorio) - URL libsql, también acepta `file:./local.db`
- `TURSO_AUTH_TOKEN` - token de Turso (no necesario para SQLite local)
- `JWT_SECRET` - secreto del JWT (cambialo!)
- `JWT_EXPIRES_IN` - por defecto `7d`
- `PORT` - por defecto `4000`
- `CORS_ORIGIN` - por defecto `http://localhost:5173`
