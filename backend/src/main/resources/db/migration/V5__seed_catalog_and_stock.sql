-- Demo catalog + opening stock at the warehouse, so the app has real data
-- to show immediately in local/dev use.

INSERT INTO brands (id, name, is_active) VALUES
    ('66666666-6666-6666-6666-666666666666', 'Madeira', TRUE),
    ('66666666-6666-6666-6666-666666666667', 'Gunold', TRUE);

INSERT INTO categories (id, name, is_active) VALUES
    ('77777777-7777-7777-7777-777777777777', 'Polyester Thread', TRUE),
    ('77777777-7777-7777-7777-777777777778', 'Rayon Thread', TRUE);

INSERT INTO products (id, name, brand_id, category_id, unit_of_measure, description, is_active) VALUES
    ('88888888-8888-8888-8888-888888888888', 'Madeira Polyneon 40', '66666666-6666-6666-6666-666666666666',
     '77777777-7777-7777-7777-777777777777', 'PIECE', 'High-sheen polyester embroidery thread, 40wt.', TRUE),
    ('88888888-8888-8888-8888-888888888889', 'Gunold Jupiter 40', '66666666-6666-6666-6666-666666666667',
     '77777777-7777-7777-7777-777777777778', 'PIECE', 'Viscose rayon embroidery thread, 40wt.', TRUE);

INSERT INTO product_variants
    (id, product_id, sku, color_name, shade_code, default_sale_price, reorder_level, is_active)
VALUES
    ('99999999-9999-9999-9999-999999999991', '88888888-8888-8888-8888-888888888888',
     'MAD-PN40-WHT', 'White', '1001', 65.00, 10, TRUE),
    ('99999999-9999-9999-9999-999999999992', '88888888-8888-8888-8888-888888888888',
     'MAD-PN40-BLK', 'Black', '1800', 65.00, 10, TRUE),
    ('99999999-9999-9999-9999-999999999993', '88888888-8888-8888-8888-888888888888',
     'MAD-PN40-RED', 'Red', '1747', 65.00, 10, TRUE),
    ('99999999-9999-9999-9999-999999999994', '88888888-8888-8888-8888-888888888889',
     'GUN-J40-WHT', 'White', 'J-1000', 58.00, 10, TRUE),
    ('99999999-9999-9999-9999-999999999995', '88888888-8888-8888-8888-888888888889',
     'GUN-J40-NVY', 'Navy', 'J-2345', 58.00, 10, TRUE);

INSERT INTO inventory_balances (id, location_id, product_variant_id, quantity, average_unit_cost)
SELECT
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111',
    v.id,
    50,
    CASE WHEN v.id IN ('99999999-9999-9999-9999-999999999994', '99999999-9999-9999-9999-999999999995')
         THEN 40.00 ELSE 45.00 END
FROM product_variants v;

INSERT INTO stock_movements
    (id, product_variant_id, location_id, movement_type, quantity_delta, unit_cost,
     reference_type, performed_by_user_id, note)
SELECT
    gen_random_uuid(),
    v.id,
    '11111111-1111-1111-1111-111111111111',
    'PURCHASE_RECEIPT',
    50,
    CASE WHEN v.id IN ('99999999-9999-9999-9999-999999999994', '99999999-9999-9999-9999-999999999995')
         THEN 40.00 ELSE 45.00 END,
    'INITIAL_STOCK',
    '33333333-3333-3333-3333-333333333333',
    'Opening stock'
FROM product_variants v;
