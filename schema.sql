-- ════════════════════════════════════════════════════════
-- AMDOX ERP | COMPLETE POSTGRESQL SCHEMA SPECIFICATION
-- ════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ════════════════════════════════════════════════════════
-- 1. CORE SYSTEM & MULTI-TENANCY
-- ════════════════════════════════════════════════════════

CREATE TABLE tenants (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  plan          TEXT NOT NULL DEFAULT 'trial' CHECK (plan IN ('trial', 'starter', 'enterprise')),
  keycloak_realm TEXT NOT NULL UNIQUE,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  settings      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  keycloak_sub  TEXT NOT NULL,
  email         TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  avatar_url    TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, keycloak_sub),
  UNIQUE(tenant_id, email)
);
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_keycloak ON users(keycloak_sub);

CREATE TABLE roles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '[]',
  is_system   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

CREATE TABLE user_roles (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id    UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

-- ════════════════════════════════════════════════════════
-- 2. FINANCE MODULE
-- ════════════════════════════════════════════════════════

CREATE TABLE accounts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code          TEXT NOT NULL,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('asset','liability','equity','revenue','expense')),
  currency      CHAR(3) NOT NULL DEFAULT 'USD',
  parent_id     UUID REFERENCES accounts(id),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, code)
);

CREATE TABLE fiscal_periods (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','locked')),
  closed_by     UUID REFERENCES users(id),
  closed_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, start_date)
);

CREATE TABLE journal_entries (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  period_id     UUID NOT NULL REFERENCES fiscal_periods(id),
  reference     TEXT,
  description   TEXT NOT NULL,
  currency      CHAR(3) NOT NULL,
  fx_rate       NUMERIC(18,6) NOT NULL DEFAULT 1,
  posted_by     UUID NOT NULL REFERENCES users(id),
  posted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_reversed   BOOLEAN NOT NULL DEFAULT FALSE,
  reversal_of   UUID REFERENCES journal_entries(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE journal_lines (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id      UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id    UUID NOT NULL REFERENCES accounts(id),
  debit         NUMERIC(20,6) NOT NULL DEFAULT 0 CHECK (debit >= 0),
  credit        NUMERIC(20,6) NOT NULL DEFAULT 0 CHECK (credit >= 0),
  description   TEXT,
  CONSTRAINT debit_or_credit CHECK (
    (debit > 0 AND credit = 0) OR (debit = 0 AND credit > 0)
  )
);
CREATE INDEX idx_jlines_entry ON journal_lines(entry_id);
CREATE INDEX idx_jlines_account ON journal_lines(account_id);

-- Trigger: enforce balanced journal entries (total debits = total credits)
CREATE OR REPLACE FUNCTION check_journal_balance()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE total_debit NUMERIC; total_credit NUMERIC;
BEGIN
  SELECT SUM(debit), SUM(credit) INTO total_debit, total_credit
  FROM journal_lines WHERE entry_id = NEW.entry_id;
  IF ABS(total_debit - total_credit) > 0.000001 THEN
    RAISE EXCEPTION 'Journal entry % is unbalanced: debits=% credits=%',
      NEW.entry_id, total_debit, total_credit;
  END IF;
  RETURN NEW;
END;
$$;

CREATE CONSTRAINT TRIGGER trg_journal_balance
  AFTER INSERT OR UPDATE ON journal_lines
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION check_journal_balance();

CREATE TABLE fx_rates (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  base_currency CHAR(3) NOT NULL,
  quote_currency CHAR(3) NOT NULL,
  rate          NUMERIC(18,6) NOT NULL,
  source        TEXT NOT NULL DEFAULT 'ECB',
  fetched_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(base_currency, quote_currency, fetched_at)
);

-- ════════════════════════════════════════════════════════
-- 3. HR & PAYROLL MODULES
-- ════════════════════════════════════════════════════════

CREATE TABLE departments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  head_id       UUID, -- FK target references employees, set later due to cyclic dependencies
  parent_id     UUID REFERENCES departments(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

CREATE TABLE employees (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id),
  employee_number TEXT NOT NULL,
  full_name       TEXT NOT NULL,
  email           TEXT NOT NULL,
  department_id   UUID REFERENCES departments(id),
  manager_id      UUID REFERENCES employees(id),
  job_title       TEXT NOT NULL,
  employment_type TEXT NOT NULL CHECK (employment_type IN ('full_time','part_time','contractor')),
  start_date      DATE NOT NULL,
  end_date        DATE,
  base_salary     NUMERIC(20,6),
  currency        CHAR(3) NOT NULL DEFAULT 'USD',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, employee_number)
);
CREATE INDEX idx_employees_tenant ON employees(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_manager ON employees(manager_id);

ALTER TABLE departments ADD CONSTRAINT fk_dept_head
  FOREIGN KEY (head_id) REFERENCES employees(id) ON DELETE SET NULL;

CREATE TABLE leave_types (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  accrual_days    NUMERIC(5,2) NOT NULL,
  max_carry_forward NUMERIC(5,2) NOT NULL DEFAULT 0,
  is_paid         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE leave_balances (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id   UUID NOT NULL REFERENCES leave_types(id),
  balance         NUMERIC(5,2) NOT NULL DEFAULT 0,
  year            SMALLINT NOT NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, leave_type_id, year)
);

CREATE TABLE leave_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id   UUID NOT NULL REFERENCES leave_types(id),
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  days_requested  NUMERIC(5,2) NOT NULL,
  reason          TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  reviewed_by     UUID REFERENCES employees(id),
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

CREATE TABLE payroll_runs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  period_name     TEXT NOT NULL,
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  status          TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','completed','failed','cancelled')),
  initiated_by    UUID NOT NULL REFERENCES users(id),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  employee_count  INTEGER,
  total_gross     NUMERIC(20,6),
  total_net       NUMERIC(20,6),
  error_log       JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payslips (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payroll_run_id  UUID NOT NULL REFERENCES payroll_runs(id),
  employee_id     UUID NOT NULL REFERENCES employees(id),
  gross_pay       NUMERIC(20,6) NOT NULL,
  net_pay         NUMERIC(20,6) NOT NULL,
  deductions      JSONB NOT NULL DEFAULT '{}',
  pdf_s3_key      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(payroll_run_id, employee_id)
);

-- ════════════════════════════════════════════════════════
-- 4. SUPPLY CHAIN MODULE
-- ════════════════════════════════════════════════════════

CREATE TABLE vendors (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  address         JSONB,
  payment_terms   INTEGER NOT NULL DEFAULT 30,
  currency        CHAR(3) NOT NULL DEFAULT 'USD',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE warehouses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code            TEXT NOT NULL,
  name            TEXT NOT NULL,
  location        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, code)
);

CREATE TABLE inventory_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sku             TEXT NOT NULL,
  name            TEXT NOT NULL,
  unit_of_measure TEXT NOT NULL DEFAULT 'each',
  reorder_point   NUMERIC(10,2) NOT NULL DEFAULT 0,
  reorder_qty     NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit_cost       NUMERIC(20,6) NOT NULL DEFAULT 0,
  costing_method  TEXT NOT NULL DEFAULT 'FIFO' CHECK (costing_method IN ('FIFO','AVCO')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, sku)
);

CREATE TABLE inventory_levels (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_id         UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  warehouse_id    UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  quantity        NUMERIC(12,2) NOT NULL DEFAULT 0,
  location        TEXT,
  last_counted_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(warehouse_id, item_id)
);

CREATE TABLE purchase_orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vendor_id       UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  order_number    TEXT NOT NULL,
  total_amount    NUMERIC(20,6) NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_approval','ordered','delivered','cancelled')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, order_number)
);

CREATE TABLE goods_receipts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  po_id           UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  receipt_number  TEXT NOT NULL,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  received_by     UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, receipt_number)
);

-- ════════════════════════════════════════════════════════
-- 5. PROJECT MANAGEMENT MODULE
-- ════════════════════════════════════════════════════════

CREATE TABLE projects (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  code          TEXT NOT NULL,
  description   TEXT,
  budget        NUMERIC(20,6) NOT NULL DEFAULT 0,
  spent         NUMERIC(20,6) NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning','active','on_hold','completed','cancelled')),
  start_date    DATE NOT NULL,
  end_date      DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, code)
);

CREATE TABLE milestones (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  due_date      DATE NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tasks (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  assignee_id   UUID REFERENCES employees(id),
  status        TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','testing','completed')),
  start_date    DATE,
  end_date      DATE,
  budget_allocated NUMERIC(20,6) DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE task_dependencies (
  task_id       UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, depends_on_id)
);

CREATE TABLE resource_allocations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  allocation_percentage NUMERIC(5,2) NOT NULL DEFAULT 100 CHECK (allocation_percentage > 0 AND allocation_percentage <= 100),
  start_date      DATE NOT NULL,
  end_date        DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════
-- 6. LEADS & AUDIT LOGS (REAL DATABASE INTEGRATION)
-- ════════════════════════════════════════════════════════

CREATE TABLE leads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source          TEXT NOT NULL,
  company         TEXT NOT NULL,
  estimated_value NUMERIC(20,6) NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','qualified','contacted')),
  partition       TEXT NOT NULL DEFAULT 'SEC_ALPHA_01',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE terminal_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id),
  command       TEXT NOT NULL,
  output        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════
-- 7. ROW-LEVEL SECURITY (RLS) POLICIES
-- ════════════════════════════════════════════════════════

-- Enable RLS on all tenant-specific tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminal_logs ENABLE ROW LEVEL SECURITY;

-- Dynamic tenant isolation policy
-- Supposes auth.jwt() contains user's active tenant ID in user_metadata: 'tenant_id'
CREATE POLICY tenant_isolation_policy ON users
  USING (tenant_id = COALESCE(current_setting('app.current_tenant_id', true)::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY tenant_isolation_policy ON roles
  USING (tenant_id = COALESCE(current_setting('app.current_tenant_id', true)::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY tenant_isolation_policy ON accounts
  USING (tenant_id = COALESCE(current_setting('app.current_tenant_id', true)::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY tenant_isolation_policy ON fiscal_periods
  USING (tenant_id = COALESCE(current_setting('app.current_tenant_id', true)::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY tenant_isolation_policy ON journal_entries
  USING (tenant_id = COALESCE(current_setting('app.current_tenant_id', true)::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY tenant_isolation_policy ON departments
  USING (tenant_id = COALESCE(current_setting('app.current_tenant_id', true)::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY tenant_isolation_policy ON employees
  USING (tenant_id = COALESCE(current_setting('app.current_tenant_id', true)::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY tenant_isolation_policy ON leave_types
  USING (tenant_id = COALESCE(current_setting('app.current_tenant_id', true)::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY tenant_isolation_policy ON leave_balances
  USING (employee_id IN (SELECT id FROM employees WHERE tenant_id = COALESCE(current_setting('app.current_tenant_id', true)::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid)));

CREATE POLICY tenant_isolation_policy ON leave_requests
  USING (employee_id IN (SELECT id FROM employees WHERE tenant_id = COALESCE(current_setting('app.current_tenant_id', true)::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid)));

CREATE POLICY tenant_isolation_policy ON payroll_runs
  USING (tenant_id = COALESCE(current_setting('app.current_tenant_id', true)::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY tenant_isolation_policy ON vendors
  USING (tenant_id = COALESCE(current_setting('app.current_tenant_id', true)::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY tenant_isolation_policy ON warehouses
  USING (tenant_id = COALESCE(current_setting('app.current_tenant_id', true)::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY tenant_isolation_policy ON inventory_items
  USING (tenant_id = COALESCE(current_setting('app.current_tenant_id', true)::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY tenant_isolation_policy ON inventory_levels
  USING (tenant_id = COALESCE(current_setting('app.current_tenant_id', true)::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY tenant_isolation_policy ON purchase_orders
  USING (tenant_id = COALESCE(current_setting('app.current_tenant_id', true)::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY tenant_isolation_policy ON goods_receipts
  USING (tenant_id = COALESCE(current_setting('app.current_tenant_id', true)::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY tenant_isolation_policy ON projects
  USING (tenant_id = COALESCE(current_setting('app.current_tenant_id', true)::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY tenant_isolation_policy ON leads
  USING (tenant_id = COALESCE(current_setting('app.current_tenant_id', true)::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY tenant_isolation_policy ON terminal_logs
  USING (tenant_id = COALESCE(current_setting('app.current_tenant_id', true)::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));
