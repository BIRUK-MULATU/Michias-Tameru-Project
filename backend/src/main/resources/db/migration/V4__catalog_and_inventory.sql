-- Product catalog and inventory ledger (Phase 3).

CREATE TABLE brands (
    id UUID PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE categories (
    id UUID PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    parent_category_id UUID REFERENCES categories (id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE products (
    id UUID PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    brand_id UUID REFERENCES brands (id),
    category_id UUID REFERENCES categories (id),
    unit_of_measure VARCHAR(10) NOT NULL CHECK (unit_of_measure IN ('PIECE', 'METER')),
    description VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE product_variants (
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products (id),
    sku VARCHAR(60) NOT NULL UNIQUE,
    color_name VARCHAR(80) NOT NULL,
    shade_code VARCHAR(40),
    default_sale_price NUMERIC(12, 2) NOT NULL CHECK (default_sale_price >= 0),
    reorder_level NUMERIC(14, 3) NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_variants_product ON product_variants (product_id);

CREATE TABLE inventory_balances (
    id UUID PRIMARY KEY,
    location_id UUID NOT NULL REFERENCES locations (id),
    product_variant_id UUID NOT NULL REFERENCES product_variants (id),
    quantity NUMERIC(14, 3) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    average_unit_cost NUMERIC(14, 4) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (location_id, product_variant_id)
);

CREATE TABLE stock_movements (
    id UUID PRIMARY KEY,
    product_variant_id UUID NOT NULL REFERENCES product_variants (id),
    location_id UUID NOT NULL REFERENCES locations (id),
    movement_type VARCHAR(30) NOT NULL CHECK (movement_type IN (
        'PURCHASE_RECEIPT', 'TRANSFER_DISPATCH', 'TRANSFER_RECEIPT', 'SALE', 'SALE_REVERSAL',
        'RETURN_SELLABLE', 'DAMAGE', 'ADJUSTMENT_INCREASE', 'ADJUSTMENT_DECREASE', 'RECONCILIATION_VARIANCE'
    )),
    quantity_delta NUMERIC(14, 3) NOT NULL,
    unit_cost NUMERIC(14, 4),
    reference_type VARCHAR(40),
    reference_id UUID,
    performed_by_user_id UUID REFERENCES users (id),
    note VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_movements_variant_location_created
    ON stock_movements (product_variant_id, location_id, created_at);
CREATE INDEX idx_stock_movements_reference ON stock_movements (reference_type, reference_id);

CREATE TABLE stock_adjustments (
    id UUID PRIMARY KEY,
    location_id UUID NOT NULL REFERENCES locations (id),
    product_variant_id UUID NOT NULL REFERENCES product_variants (id),
    quantity_delta NUMERIC(14, 3) NOT NULL,
    reason VARCHAR(500) NOT NULL,
    requested_by UUID NOT NULL REFERENCES users (id),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    approved_by UUID REFERENCES users (id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_adjustments_location ON stock_adjustments (location_id);
