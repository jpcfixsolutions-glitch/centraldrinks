-- =====================================================================
-- Centraldrinks - Schema SQL para Turso (libSQL / SQLite)
-- =====================================================================
-- FORMAS DE APLICARLO:
--
--   A) Desde Node (recomendado, usa tus credenciales de .env):
--        cd backend
--        npm run db:migrate
--
--   B) Por CLI de Turso (redirigiendo el archivo):
--        turso db shell <nombre-db> < backend/src/db/schema.sql
--
--   C) Dentro del shell interactivo de Turso:
--        turso db shell <nombre-db>
--        .read backend/src/db/schema.sql
--
--   ⚠️ NO uses Turso Studio (web) para pegar este archivo entero:
--      la consola web suele ejecutar solo el primer statement.
--      Si querés usar la web, pegá los CREATE TABLE y los INSERT
--      uno por uno.
-- =====================================================================

-- ---------------------------------------------------------------------
-- USUARIOS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  nombre        TEXT    NOT NULL,
  rol           TEXT    NOT NULL DEFAULT 'empleado'
                CHECK (rol IN ('administrador', 'empleado')),
  activo        INTEGER NOT NULL DEFAULT 1
                CHECK (activo IN (0, 1)),
  created_at    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- CATEGORÍAS DE PRODUCTOS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre     TEXT    NOT NULL UNIQUE,
  created_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- MÉTODOS DE PAGO
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS metodos_pago (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre     TEXT    NOT NULL UNIQUE,
  recargo    REAL    NOT NULL DEFAULT 0,
  activo     INTEGER NOT NULL DEFAULT 1
             CHECK (activo IN (0, 1)),
  created_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- PRODUCTOS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS productos (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre           TEXT    NOT NULL,
  categoria_id     INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
  costo_unitario   REAL    NOT NULL DEFAULT 0,
  precio_mesa      REAL    NOT NULL DEFAULT 0,
  precio_mostrador REAL    NOT NULL DEFAULT 0,
  stock            INTEGER NOT NULL DEFAULT 0,
  imagen           TEXT,
  activo           INTEGER NOT NULL DEFAULT 1
                   CHECK (activo IN (0, 1)),
  created_at       TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);

-- ---------------------------------------------------------------------
-- MESAS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mesas (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  numero     INTEGER NOT NULL UNIQUE,
  estado     TEXT    NOT NULL DEFAULT 'libre'
             CHECK (estado IN ('libre', 'ocupada', 'cerrando')),
  activa     INTEGER NOT NULL DEFAULT 1
             CHECK (activa IN (0, 1)),
  created_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- CIERRES DE CAJA
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cierres_caja (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  caja            TEXT    NOT NULL DEFAULT 'Caja 01',
  usuario_id      INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  empleado        TEXT    NOT NULL,
  cantidad_ventas INTEGER NOT NULL DEFAULT 0,
  ingreso_total   REAL    NOT NULL DEFAULT 0,
  fecha_cierre    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cierres_usuario ON cierres_caja(usuario_id);
CREATE INDEX IF NOT EXISTS idx_cierres_fecha   ON cierres_caja(fecha_cierre);

-- ---------------------------------------------------------------------
-- VENTAS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ventas (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo          TEXT    NOT NULL UNIQUE,
  tipo            TEXT    NOT NULL
                  CHECK (tipo IN ('mostrador', 'mesa')),
  numero_mesa     INTEGER,
  total           REAL    NOT NULL,
  descuento       REAL    NOT NULL DEFAULT 0,
  metodo_pago     TEXT    NOT NULL,
  usuario_id      INTEGER REFERENCES usuarios(id)     ON DELETE SET NULL,
  cierre_caja_id  INTEGER REFERENCES cierres_caja(id) ON DELETE SET NULL,
  fecha           TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ventas_usuario ON ventas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ventas_cierre  ON ventas(cierre_caja_id);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha   ON ventas(fecha);
CREATE INDEX IF NOT EXISTS idx_ventas_tipo    ON ventas(tipo);

-- ---------------------------------------------------------------------
-- ITEMS (RENGLONES) DE CADA VENTA
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS venta_items (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  venta_id        INTEGER NOT NULL REFERENCES ventas(id)    ON DELETE CASCADE,
  producto_id     INTEGER          REFERENCES productos(id) ON DELETE SET NULL,
  nombre_producto TEXT    NOT NULL,
  precio          REAL    NOT NULL,
  cantidad        INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_venta_items_venta    ON venta_items(venta_id);
CREATE INDEX IF NOT EXISTS idx_venta_items_producto ON venta_items(producto_id);

-- ---------------------------------------------------------------------
-- PAGOS DE CADA VENTA (soporta cobro dividido)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS venta_pagos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  venta_id    INTEGER NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  metodo_pago TEXT    NOT NULL,
  monto       REAL    NOT NULL,
  recargo     REAL    NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_venta_pagos_venta ON venta_pagos(venta_id);

-- =====================================================================
-- DATOS INICIALES (SEED)
-- =====================================================================
-- Las contraseñas son hashes bcrypt (cost 10) de:
--   admin     -> admin123
--   empleado1 -> emp123
--   empleado2 -> emp123
-- Si querés generar nuevos hashes podés correr `npm run db:seed`,
-- que también es idempotente.
-- =====================================================================

INSERT OR IGNORE INTO usuarios (username, password_hash, nombre, rol) VALUES
  ('admin',     '$2a$10$CjrK5kBHo2nS3r9/FWIHh.uP.tg5zJC.SZB4PT8zTE44uOcyVd4e.', 'Administrador', 'administrador'),
  ('empleado1', '$2a$10$d.WB0XEXviFIStmm89HpOO8CaeB0CQ.8/hIoyGTD6AfgfMg/IlCKi', 'Empleado #1',   'empleado'),
  ('empleado2', '$2a$10$y2AKhlGJh8dGBlfSMTWwX.GTiqlnP440sEU7Og97GtNFeoHJWfRxW', 'Empleado #2',   'empleado');

INSERT OR IGNORE INTO categorias (nombre) VALUES
  ('Vinos'),
  ('Tapas'),
  ('Cervezas'),
  ('Promociones');

INSERT OR IGNORE INTO metodos_pago (nombre, recargo) VALUES
  ('Efectivo',        0),
  ('Transferencia',   0),
  ('Tarjeta Débito',  5),
  ('Tarjeta Crédito', 10);

INSERT OR IGNORE INTO mesas (numero) VALUES
  (1), (2), (3), (4), (5), (6), (7), (8), (9), (10), (11), (12);

INSERT OR IGNORE INTO productos
  (nombre,                                  categoria_id,                                                       costo_unitario, precio_mesa, precio_mostrador, stock)
VALUES
  ('Promo Absolut + 2 Speed XL',            (SELECT id FROM categorias WHERE nombre = 'Promociones'), 25000, 45000, 30000, 1000),
  ('Promo fernet + coca de 2l retornable',  (SELECT id FROM categorias WHERE nombre = 'Promociones'), 15000, 30000, 20000, 1000),
  ('Promo Skyy + 2 Speed',                  (SELECT id FROM categorias WHERE nombre = 'Promociones'), 12000, 30000, 15500, 1000),
  ('Vino Santa Julia',                      (SELECT id FROM categorias WHERE nombre = 'Vinos'),        8000, 15000, 11000,   10);

-- =====================================================================
-- FIN
-- =====================================================================
