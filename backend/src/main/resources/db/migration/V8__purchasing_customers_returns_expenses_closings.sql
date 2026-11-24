-- Suppliers, purchases, customers, returns, expenses, daily closing (Phase 6).

CREATE TABLE suppliers (
    id UUID PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(160),
    address VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE purchases (
    id UUID PRIMARY KEY,
    supplier_id UUID NOT NULL REFERENCES suppliers (id),
    location_id UUID NOT NULL REFERENCES locations (id),
    purchase_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'RECEIVED', 'CANCELLED')),
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    created_by UUID NOT NULL REFERENCES users (id),
    received_by UUID REFERENCES users (id),
    received_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_purchases_location ON purchases (location_id);
CREATE INDEX idx_purchases_supplier ON purchases (supplier_id);

CREATE TABLE purchase_items (
    id UUID PRIMARY KEY,
    purchase_id UUID NOT NULL REFERENCES purchases (id),
    product_variant_id UUID NOT NULL REFERENCES product_variants (id),
    quantity NUMERIC(14, 3) NOT NULL CHECK (quantity > 0),
    unit_cost NUMERIC(14, 4) NOT NULL CHECK (unit_cost >= 0),
    line_total NUMERIC(14, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_purchase_items_purchase ON purchase_items (purchase_id);

CREATE TABLE customers (
    id UUID PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    phone VARCHAR(30),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sales ADD COLUMN customer_id UUID REFERENCES customers (id);
CREATE INDEX idx_sales_customer ON sales (customer_id);

CREATE TABLE returns (
    id UUID PRIMARY KEY,
    original_sale_id UUID NOT NULL REFERENCES sales (id),
    processed_by UUID NOT NULL REFERENCES users (id),
    approved_by UUID REFERENCES users (id),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    return_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_returns_sale ON returns (original_sale_id);

CREATE TABLE return_items (
    id UUID PRIMARY KEY,
    return_id UUID NOT NULL REFERENCES returns (id),
    sale_item_id UUID NOT NULL REFERENCES sale_items (id),
    quantity NUMERIC(14, 3) NOT NULL CHECK (quantity > 0),
    condition VARCHAR(20) NOT NULL CHECK (condition IN ('SELLABLE', 'DAMAGED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_return_items_return ON return_items (return_id);
CREATE INDEX idx_return_items_sale_item ON return_items (sale_item_id);

CREATE TABLE expenses (
    id UUID PRIMARY KEY,
    location_id UUID REFERENCES locations (id),
    category VARCHAR(80) NOT NULL,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    description VARCHAR(500),
    expense_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    recorded_by UUID NOT NULL REFERENCES users (id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_expenses_location_date ON expenses (location_id, expense_date);

CREATE TABLE daily_closings (
    id UUID PRIMARY KEY,
    location_id UUID NOT NULL REFERENCES locations (id),
    submitted_by UUID NOT NULL REFERENCES users (id),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'REVIEWED')),
    reviewed_by UUID REFERENCES users (id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (period_end > period_start)
);

CREATE INDEX idx_daily_closings_location_period ON daily_closings (location_id, period_end);

CREATE TABLE daily_closing_items (
    id UUID PRIMARY KEY,
    closing_id UUID NOT NULL REFERENCES daily_closings (id),
    product_variant_id UUID NOT NULL REFERENCES product_variants (id),
    opening_qty NUMERIC(14, 3) NOT NULL,
    received_qty NUMERIC(14, 3) NOT NULL,
    sold_qty NUMERIC(14, 3) NOT NULL,
    sellable_return_qty NUMERIC(14, 3) NOT NULL,
    approved_adjustment_qty NUMERIC(14, 3) NOT NULL,
    expected_qty NUMERIC(14, 3) NOT NULL,
    counted_qty NUMERIC(14, 3) NOT NULL,
    discrepancy_qty NUMERIC(14, 3) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_daily_closing_items_closing ON daily_closing_items (closing_id);
