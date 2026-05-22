-- =====================================================================
-- Club 22 - Schema SQL para Turso (libSQL / SQLite)
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
  stock_minimo     INTEGER NOT NULL DEFAULT 5,
  imagen           TEXT,
  activo           INTEGER NOT NULL DEFAULT 1
                   CHECK (activo IN (0, 1)),
  created_at       TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);

-- ---------------------------------------------------------------------
-- COMPONENTES DE PROMOCIONES (Productos compuestos)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS promocion_items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  promocion_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  producto_id  INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  cantidad     INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_promocion_items_promocion ON promocion_items(promocion_id);

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
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  caja             TEXT    NOT NULL DEFAULT 'Caja 01',
  usuario_id       INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  empleado         TEXT    NOT NULL,
  efectivo_inicial REAL    NOT NULL DEFAULT 0,
  fecha_apertura   TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  abierta          INTEGER NOT NULL DEFAULT 1 CHECK (abierta IN (0, 1)),
  cantidad_ventas  INTEGER NOT NULL DEFAULT 0,
  ingreso_total    REAL    NOT NULL DEFAULT 0,
  ingreso_efectivo REAL    NOT NULL DEFAULT 0,
  ingreso_virtual  REAL    NOT NULL DEFAULT 0,
  egreso_efectivo  REAL    NOT NULL DEFAULT 0,
  fecha_cierre     TEXT
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

-- ---------------------------------------------------------------------
-- GASTOS VARIABLES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gastos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  asunto      TEXT    NOT NULL,
  monto       REAL    NOT NULL,
  metodo_pago TEXT    NOT NULL
              CHECK (metodo_pago IN ('Efectivo', 'Virtual')),
  usuario_id  INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha       TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos(fecha);

-- ---------------------------------------------------------------------
-- GASTOS FIJOS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gastos_fijos (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT    NOT NULL,
  monto  REAL    NOT NULL
);

-- ---------------------------------------------------------------------
-- BOTELLAS EN BARRA
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS botellas_barra (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  producto_id     INTEGER REFERENCES productos(id) ON DELETE CASCADE,
  nombre_producto TEXT    NOT NULL,
  fecha_apertura  TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_botellas_producto ON botellas_barra(producto_id);

-- ---------------------------------------------------------------------
-- LOGS DE AUDITORÍA
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo       TEXT    NOT NULL,
  mensaje    TEXT    NOT NULL,
  detalle    TEXT,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha      TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_fecha ON audit_logs(fecha);

-- =====================================================================
-- FIN
-- =====================================================================
