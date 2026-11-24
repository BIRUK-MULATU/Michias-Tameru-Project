-- Seed data for local/dev use: one warehouse, one shop, one admin, one
-- salesperson assigned to the shop. Passwords below are bcrypt hashes;
-- plaintext dev credentials are documented in README.md, never here.

INSERT INTO locations (id, name, type, address, is_active) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Main Warehouse', 'WAREHOUSE', NULL, TRUE),
    ('22222222-2222-2222-2222-222222222222', 'Sales Shop', 'SHOP', NULL, TRUE);

INSERT INTO users (id, username, email, password_hash, full_name, role, is_active) VALUES
    ('33333333-3333-3333-3333-333333333333', 'admin', 'admin@threadims.local',
     '$2b$10$hjXNcFl0A43taJ2CdIDI7.umOAe49ZEwqDTda.nUnjmOHmPCcpqUK', 'System Administrator', 'ADMIN', TRUE),
    ('44444444-4444-4444-4444-444444444444', 'sales1', 'sales1@threadims.local',
     '$2b$10$orqnS9ZiPpjnpWH4gPIfueTjVAlSbQIloWB5tEuCpreH0GaQawaaO', 'Shop Salesperson', 'SALESPERSON', TRUE);

INSERT INTO user_location_assignments (id, user_id, location_id) VALUES
    ('55555555-5555-5555-5555-555555555555',
     '44444444-4444-4444-4444-444444444444',
     '22222222-2222-2222-2222-222222222222');
