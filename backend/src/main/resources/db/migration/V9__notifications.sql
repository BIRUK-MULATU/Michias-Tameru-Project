-- Notification center (Phase 7).

CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    recipient_user_id UUID REFERENCES users (id),
    type VARCHAR(60) NOT NULL,
    title VARCHAR(160) NOT NULL,
    message VARCHAR(500) NOT NULL,
    reference_type VARCHAR(40),
    reference_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_recipient ON notifications (recipient_user_id, created_at);
