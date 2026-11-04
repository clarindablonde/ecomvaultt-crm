-- ==============================================================================
-- ECOMVAULTT COMMERCE OS - SEED DATA
-- Matches data from EcomVaultt-Design.html mockup
-- ==============================================================================

-- 1. Insert Warehouses
insert into public.warehouses (id, name, code, state_city, address) values
  ('11111111-1111-1111-1111-111111111101', 'Lagos (Ikeja)', 'LOS-IKJ', 'Lagos', '12 Allen Avenue, Ikeja, Lagos'),
  ('11111111-1111-1111-1111-111111111102', 'Abuja (Wuse II)', 'ABJ-WUS', 'Abuja', 'Plot 42 Aminu Kano Crescent, Wuse II, Abuja'),
  ('11111111-1111-1111-1111-111111111103', 'Port Harcourt (GRA)', 'PH-GRA', 'Rivers', '18 Tombia Street, GRA Phase 2, Port Harcourt'),
  ('11111111-1111-1111-1111-111111111104', 'Accra (Ghana)', 'ACC-GH', 'Greater Accra', 'Spintex Road, Accra');

-- 2. Insert Products
insert into public.products (id, sku, title, description, selling_price, cost_price, nafdac_reg_number) values
  ('22222222-2222-2222-2222-222222222201', 'SKU-SRS-01', 'Skin Repair Set', 'Full set with repair serum, night cream and cleanser. NAFDAC approved.', 48500.00, 22000.00, 'NAFDAC-04-8921'),
  ('22222222-2222-2222-2222-222222222202', 'SKU-DW-02', 'Duchess White Luxury Cream', 'Advanced brightening and glow maintenance cream.', 38000.00, 16500.00, 'NAFDAC-04-7714'),
  ('22222222-2222-2222-2222-222222222203', 'SKU-RNS-03', 'Radiance Night Serum', 'Intensive hyaluronic and vitamin complex for overnight repair.', 28000.00, 11500.00, 'NAFDAC-04-9910'),
  ('22222222-2222-2222-2222-222222222204', 'SKU-GS-04', 'Glow Clarifying Soap', 'Gentle exfoliating botanical cleansing bar.', 6500.00, 2500.00, 'NAFDAC-04-3320');

-- 3. Insert Inventory Levels
insert into public.inventory (warehouse_id, product_id, stock_on_hand, stock_reserved, reorder_threshold) values
  ('11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201', 340, 15, 50),
  ('11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222202', 210, 8, 40),
  ('11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222201', 180, 5, 30),
  ('11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222201', 95, 2, 25);

-- 4. Insert Customers
insert into public.customers (id, full_name, phone_number, instagram_handle, delivery_address, city, state, health_score, tags, source_channel, lifetime_orders, lifetime_spend) values
  ('33333333-3333-3333-3333-333333333301', 'Adaeze Okafor', '+2348034521187', '@adaeze.glow', 'Plot 14 Admiralty Way, Lekki Phase 1', 'Lekki', 'Lagos', 86, array['loyal', 'ready_to_buy'], 'instagram', 7, 412300.00),
  ('33333333-3333-3333-3333-333333333302', 'Ibrahim Musa', '+2348021123456', null, 'Block 4, Flat 2, Wuse Zone 4', 'Wuse', 'Abuja', 92, array['loyal'], 'facebook', 4, 280000.00),
  ('33333333-3333-3333-3333-333333333303', 'Chioma Eze', '+2348098765432', null, '7 Tombia Extension, GRA', 'GRA', 'Rivers', 70, array['at_risk'], 'tiktok', 3, 165000.00),
  ('33333333-3333-3333-3333-333333333304', 'Tunde Bakare', '+2348076543210', null, '18 Toyin Street, Ikeja', 'Ikeja', 'Lagos', 78, array['follow_up'], 'whatsapp', 2, 95000.00),
  ('33333333-3333-3333-3333-333333333305', 'Fatima Bello', '+2348123456789', '@fatima.bello', 'Nassarawa GRA', 'Kano', 'Kano', 95, array['vip'], 'instagram', 11, 740000.00);

-- 5. Insert Orders
insert into public.orders (id, order_code, customer_id, warehouse_id, status, payment_method, payment_status, subtotal, total_amount, delivery_address, delivery_city, delivery_state) values
  ('44444444-4444-4444-4444-444444444401', 'EV-4821', '33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111101', 'out_for_delivery', 'cod_cash', 'pending', 86500.00, 86500.00, 'Plot 14 Admiralty Way, Lekki Phase 1', 'Lekki', 'Lagos'),
  ('44444444-4444-4444-4444-444444444402', 'EV-4820', '33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111102', 'delivered_paid', 'cod_cash', 'holding_by_dispatcher', 142000.00, 142000.00, 'Block 4, Flat 2, Wuse Zone 4', 'Wuse', 'Abuja'),
  ('44444444-4444-4444-4444-444444444403', 'EV-4819', '33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111103', 'delivered_paid', 'cod_transfer', 'transferred_to_bank', 58000.00, 58000.00, '7 Tombia Extension, GRA', 'GRA', 'Rivers'),
  ('44444444-4444-4444-4444-444444444404', 'EV-4818', '33333333-3333-3333-3333-333333333304', '11111111-1111-1111-1111-111111111101', 'awaiting_dispatch', 'cod_cash', 'pending', 210400.00, 210400.00, '18 Toyin Street, Ikeja', 'Ikeja', 'Lagos'),
  ('44444444-4444-4444-4444-444444444405', 'EV-4817', '33333333-3333-3333-3333-333333333305', '11111111-1111-1111-1111-111111111102', 'failed_unreachable', 'cod_cash', 'pending', 74900.00, 74900.00, 'Nassarawa GRA', 'Kano', 'Kano');
