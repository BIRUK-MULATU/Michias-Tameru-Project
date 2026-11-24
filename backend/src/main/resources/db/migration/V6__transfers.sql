-- Stock transfers between locations (Phase 4).

CREATE TABLE stock_transfers (
    id UUID PRIMARY KEY,
    from_location_id UUID NOT NULL REFERENCES locations (id),
    to_location_id UUID NOT NULL REFERENCES locations (id),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'DISPATCHED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED')),
    created_by UUID NOT NULL REFERENCES users (id),
    dispatched_by UUID REFERENCES users (id),
    dispatched_at TIMESTAMPTZ,
    received_by UUID REFERENCES users (id),
    received_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (from_location_id <> to_location_id)
);

CREATE INDEX idx_stock_transfers_from ON stock_transfers (from_location_id);
CREATE INDEX idx_stock_transfers_to ON stock_transfers (to_location_id);
CREATE INDEX idx_stock_transfers_status ON stock_transfers (status);

CREATE TABLE stock_transfer_items (
    id UUID PRIMARY KEY,
    transfer_id UUID NOT NULL REFERENCES stock_transfers (id),
    product_variant_id UUID NOT NULL REFERENCES product_variants (id),
    quantity_dispatched NUMERIC(14, 3) NOT NULL CHECK (quantity_dispatched > 0),
    quantity_received NUMERIC(14, 3) NOT NULL DEFAULT 0 CHECK (quantity_received >= 0),
    unit_cost_at_dispatch NUMERIC(14, 4),
    discrepancy_note VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (quantity_received <= quantity_dispatched)
);

CREATE INDEX idx_stock_transfer_items_transfer ON stock_transfer_items (transfer_id);
