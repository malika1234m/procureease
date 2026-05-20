-- ProcureEase ERP — Full Database Schema v1.0
-- Run: psql -U <user> -d procureease -f schema.sql

-- ── Users & Auth ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  role       VARCHAR(50) DEFAULT 'employee'
               CHECK (role IN ('admin','procurement_manager','store_keeper','finance_officer','employee')),
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ── Suppliers ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(150) NOT NULL,
  email          VARCHAR(150),
  phone          VARCHAR(20),
  address        TEXT,
  contact_person VARCHAR(100),
  payment_terms  INTEGER DEFAULT 30,
  rating         DECIMAL(2,1) DEFAULT 0,
  status         VARCHAR(20) DEFAULT 'active'
                   CHECK (status IN ('active','inactive','blacklisted')),
  created_by     INTEGER REFERENCES users(id),
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW()
);

-- ── Inventory ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS items (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(150) NOT NULL,
  code          VARCHAR(50) UNIQUE,
  description   TEXT,
  category_id   INTEGER REFERENCES categories(id),
  unit          VARCHAR(50),
  current_stock DECIMAL(10,2) DEFAULT 0,
  reorder_level DECIMAL(10,2) DEFAULT 0,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id         SERIAL PRIMARY KEY,
  item_id    INTEGER REFERENCES items(id) ON DELETE CASCADE,
  type       VARCHAR(20) NOT NULL CHECK (type IN ('in','out','adjustment')),
  quantity   DECIMAL(10,2) NOT NULL,
  reference  VARCHAR(100),
  notes      TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ── Procurement ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_requisitions (
  id            SERIAL PRIMARY KEY,
  pr_number     VARCHAR(50) UNIQUE NOT NULL,
  requested_by  INTEGER REFERENCES users(id),
  department    VARCHAR(100),
  required_date DATE,
  status        VARCHAR(30) DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected','converted')),
  notes         TEXT,
  approved_by   INTEGER REFERENCES users(id),
  approved_at   TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pr_items (
  id                   SERIAL PRIMARY KEY,
  pr_id                INTEGER REFERENCES purchase_requisitions(id) ON DELETE CASCADE,
  item_id              INTEGER REFERENCES items(id),
  item_name            VARCHAR(150),
  quantity             DECIMAL(10,2) NOT NULL,
  unit                 VARCHAR(50) DEFAULT 'pcs',
  estimated_unit_price DECIMAL(12,2),
  notes                TEXT
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id                SERIAL PRIMARY KEY,
  po_number         VARCHAR(50) UNIQUE NOT NULL,
  supplier_id       INTEGER REFERENCES suppliers(id),
  pr_id             INTEGER REFERENCES purchase_requisitions(id),
  order_date        DATE DEFAULT CURRENT_DATE,
  expected_delivery DATE,
  status            VARCHAR(30) DEFAULT 'sent'
                      CHECK (status IN ('draft','sent','partial','received','cancelled')),
  subtotal          DECIMAL(12,2) DEFAULT 0,
  tax_amount        DECIMAL(12,2) DEFAULT 0,
  total_amount      DECIMAL(12,2) DEFAULT 0,
  notes             TEXT,
  created_by        INTEGER REFERENCES users(id),
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS po_items (
  id                SERIAL PRIMARY KEY,
  po_id             INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_id           INTEGER REFERENCES items(id),
  item_name         VARCHAR(150),
  quantity          DECIMAL(10,2) NOT NULL,
  unit              VARCHAR(50) DEFAULT 'pcs',
  unit_price        DECIMAL(12,2) NOT NULL,
  tax_percent       DECIMAL(5,2) DEFAULT 0,
  total             DECIMAL(12,2) NOT NULL,
  received_quantity DECIMAL(10,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS grn (
  id            SERIAL PRIMARY KEY,
  grn_number    VARCHAR(50) UNIQUE NOT NULL,
  po_id         INTEGER REFERENCES purchase_orders(id),
  received_date DATE DEFAULT CURRENT_DATE,
  received_by   INTEGER REFERENCES users(id),
  status        VARCHAR(20) DEFAULT 'complete' CHECK (status IN ('complete','partial')),
  notes         TEXT,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grn_items (
  id                SERIAL PRIMARY KEY,
  grn_id            INTEGER REFERENCES grn(id) ON DELETE CASCADE,
  po_item_id        INTEGER REFERENCES po_items(id),
  item_id           INTEGER REFERENCES items(id),
  ordered_quantity  DECIMAL(10,2),
  received_quantity DECIMAL(10,2) NOT NULL,
  notes             TEXT
);

-- ── Finance ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS supplier_invoices (
  id             SERIAL PRIMARY KEY,
  invoice_number VARCHAR(100) NOT NULL,
  supplier_id    INTEGER REFERENCES suppliers(id),
  po_id          INTEGER REFERENCES purchase_orders(id),
  grn_id         INTEGER REFERENCES grn(id),
  invoice_date   DATE,
  due_date       DATE,
  amount         DECIMAL(12,2) NOT NULL,
  tax_amount     DECIMAL(12,2) DEFAULT 0,
  total_amount   DECIMAL(12,2) NOT NULL,
  status         VARCHAR(30) DEFAULT 'pending'
                   CHECK (status IN ('pending','approved','paid','disputed')),
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id             SERIAL PRIMARY KEY,
  payment_number VARCHAR(30) UNIQUE NOT NULL,
  invoice_id     INTEGER REFERENCES supplier_invoices(id),
  supplier_id    INTEGER REFERENCES suppliers(id),
  amount         DECIMAL(12,2) NOT NULL,
  payment_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  method         VARCHAR(30) DEFAULT 'bank_transfer'
                   CHECK (method IN ('bank_transfer','cheque','cash','online')),
  reference      VARCHAR(100),
  notes          TEXT,
  created_by     INTEGER REFERENCES users(id),
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
  id             SERIAL PRIMARY KEY,
  expense_number VARCHAR(30) UNIQUE NOT NULL,
  title          VARCHAR(200) NOT NULL,
  category       VARCHAR(100),
  amount         DECIMAL(12,2) NOT NULL,
  expense_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  vendor         VARCHAR(150),
  description    TEXT,
  status         VARCHAR(20) DEFAULT 'recorded'
                   CHECK (status IN ('recorded','approved','rejected')),
  created_by     INTEGER REFERENCES users(id),
  approved_by    INTEGER REFERENCES users(id),
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW()
);

-- ── HR ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
  id               SERIAL PRIMARY KEY,
  emp_number       VARCHAR(20) UNIQUE NOT NULL,
  name             VARCHAR(150) NOT NULL,
  nic              VARCHAR(20) UNIQUE,
  email            VARCHAR(150),
  phone            VARCHAR(20),
  address          TEXT,
  date_of_birth    DATE,
  date_joined      DATE NOT NULL DEFAULT CURRENT_DATE,
  department       VARCHAR(100),
  designation      VARCHAR(100),
  employment_type  VARCHAR(20) DEFAULT 'permanent'
                     CHECK (employment_type IN ('permanent','contract','part_time','probation')),
  basic_salary     NUMERIC(12,2) DEFAULT 0,
  allowances       NUMERIC(12,2) DEFAULT 0,
  status           VARCHAR(20) DEFAULT 'active'
                     CHECK (status IN ('active','inactive','terminated')),
  created_by       INTEGER REFERENCES users(id),
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance (
  id          SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  status      VARCHAR(20) DEFAULT 'present'
                CHECK (status IN ('present','absent','half_day','late','leave')),
  in_time     TIME,
  out_time    TIME,
  notes       TEXT,
  created_by  INTEGER REFERENCES users(id),
  created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE (employee_id, date)
);

CREATE TABLE IF NOT EXISTS payroll (
  id               SERIAL PRIMARY KEY,
  payroll_number   VARCHAR(30) UNIQUE NOT NULL,
  employee_id      INTEGER REFERENCES employees(id),
  month            INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year             INTEGER NOT NULL,
  basic_salary     NUMERIC(12,2) NOT NULL,
  allowances       NUMERIC(12,2) DEFAULT 0,
  overtime         NUMERIC(12,2) DEFAULT 0,
  gross_salary     NUMERIC(12,2) NOT NULL,
  epf_employee     NUMERIC(12,2) DEFAULT 0,
  epf_employer     NUMERIC(12,2) DEFAULT 0,
  etf_employer     NUMERIC(12,2) DEFAULT 0,
  other_deductions NUMERIC(12,2) DEFAULT 0,
  net_salary       NUMERIC(12,2) NOT NULL,
  status           VARCHAR(20) DEFAULT 'draft'
                     CHECK (status IN ('draft','approved','paid')),
  notes            TEXT,
  processed_by     INTEGER REFERENCES users(id),
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW(),
  UNIQUE (employee_id, month, year)
);

-- ── Seed: default admin (password: Admin@1234) ────────────────
INSERT INTO users (name, email, password, role)
VALUES ('Admin User', 'admin@procureease.com',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON CONFLICT (email) DO NOTHING;
