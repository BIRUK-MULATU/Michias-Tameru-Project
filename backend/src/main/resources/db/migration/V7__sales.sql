-- POS sales and payments (Phase 5).

CREATE SEQUENCE sale_number_seq START WITH 1;

CREATE TABLE sales (
    id UUID PRIMARY KEY,
    sale_number VARCHAR(30) NOT NULL UNIQUE,
    location_id UUID NOT NULL REFERENCES locations (id),
    salesperson_user_id UUID NOT NULL REFERENCES users (id),
    sale_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED', 'REVERSED')),
    subtotal NUMERIC(14, 2) NOT NULL,
    discount_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(14, 2) NOT NULL,
    reversed_by UUID REFERENCES users (id),
    reversed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_location_date ON sales (location_id, sale_date);
CREATE INDEX idx_sales_salesperson ON sales (salesperson_user_id);

CREATE TABLE sale_items (
    id UUID PRIMARY KEY,
    sale_id UUID NOT NULL REFERENCES sales (id),
    product_variant_id UUID NOT NULL REFERENCES product_variants (id),
    quantity NUMERIC(14, 3) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    line_total NUMERIC(14, 2) NOT NULL,
    unit_cost_at_sale NUMERIC(14, 4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sale_items_sale ON sale_items (sale_id);

CREATE TABLE payments (
    id UUID PRIMARY KEY,
    sale_id UUID NOT NULL REFERENCES sales (id),
    method VARCHAR(20) NOT NULL CHECK (method IN ('CASH', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CARD')),
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    reference_no VARCHAR(100),
    paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_sale ON payments (sale_id);
