-- Mock Data Insertion Script for Food Delivery Microservices
-- Run this script to populate the database with sample data

-- =============================================
-- RESTAURANT SERVICE DATA
-- =============================================

-- Insert sample restaurants
INSERT INTO restaurant_svc.restaurants (
    id, name, cuisine, address, phone, rating, delivery_time, delivery_fee, 
    is_open, opening_time, closing_time, is_active, created_at
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440001',
    'Mario''s Pizza Palace',
    'Italian',
    '123 Main St, Downtown',
    '+1-555-0123',
    4.5,
    '25-35 min',
    2.99,
    true,
    '11:00',
    '22:00',
    true,
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    'Burger Junction',
    'American',
    '456 Oak Ave, Midtown',
    '+1-555-0456',
    4.2,
    '20-30 min',
    1.99,
    true,
    '10:00',
    '23:00',
    true,
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    'Thai Garden',
    'Thai',
    '789 Pine St, Uptown',
    '+1-555-0789',
    4.7,
    '30-40 min',
    3.49,
    true,
    '12:00',
    '21:00',
    true,
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Insert sample menu items
INSERT INTO restaurant_svc.menu_items (
    id, restaurant_id, name, description, price, category, 
    is_available, preparation_time, created_at
) VALUES 
-- Mario's Pizza Palace menu
(
    '550e8400-e29b-41d4-a716-446655440101',
    '550e8400-e29b-41d4-a716-446655440001',
    'Margherita Pizza',
    'Fresh mozzarella, tomato sauce, and basil',
    12.99,
    'pizza',
    true,
    15,
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440102',
    '550e8400-e29b-41d4-a716-446655440001',
    'Pepperoni Pizza',
    'Classic pepperoni with mozzarella and tomato sauce',
    14.99,
    'pizza',
    true,
    15,
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440103',
    '550e8400-e29b-41d4-a716-446655440001',
    'Caesar Salad',
    'Fresh romaine lettuce, croutons, parmesan cheese',
    8.99,
    'salad',
    true,
    10,
    NOW()
),
-- Burger Junction menu
(
    '550e8400-e29b-41d4-a716-446655440104',
    '550e8400-e29b-41d4-a716-446655440002',
    'Classic Burger',
    'Beef patty, lettuce, tomato, onion, special sauce',
    9.99,
    'burger',
    true,
    12,
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440105',
    '550e8400-e29b-41d4-a716-446655440002',
    'Bacon Cheeseburger',
    'Beef patty, bacon, cheese, lettuce, tomato',
    11.99,
    'burger',
    true,
    15,
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440106',
    '550e8400-e29b-41d4-a716-446655440002',
    'French Fries',
    'Crispy golden fries with sea salt',
    4.99,
    'sides',
    true,
    8,
    NOW()
),
-- Thai Garden menu
(
    '550e8400-e29b-41d4-a716-446655440107',
    '550e8400-e29b-41d4-a716-446655440003',
    'Pad Thai',
    'Stir-fried rice noodles with shrimp, tofu, and peanuts',
    13.99,
    'noodles',
    true,
    20,
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440108',
    '550e8400-e29b-41d4-a716-446655440003',
    'Green Curry',
    'Spicy green curry with chicken and vegetables',
    14.99,
    'curry',
    true,
    18,
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440109',
    '550e8400-e29b-41d4-a716-446655440003',
    'Spring Rolls',
    'Fresh vegetables wrapped in rice paper',
    6.99,
    'appetizer',
    true,
    10,
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- DELIVERY SERVICE DATA
-- =============================================

-- Insert sample drivers
INSERT INTO delivery_svc.drivers (
    id, name, phone, vehicle, license_plate, is_available,
    current_location_lat, current_location_lng, rating, total_deliveries,
    created_at, updated_at
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440201',
    'John Smith',
    '+1-555-1001',
    'Honda Civic',
    'ABC-123',
    true,
    40.7128,
    -74.006,
    4.8,
    156,
    NOW(),
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440202',
    'Sarah Johnson',
    '+1-555-1002',
    'Toyota Corolla',
    'XYZ-789',
    true,
    40.7589,
    -73.9851,
    4.9,
    203,
    NOW(),
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440203',
    'Mike Davis',
    '+1-555-1003',
    'Ford Focus',
    'DEF-456',
    true,
    40.7505,
    -73.9934,
    4.6,
    89,
    NOW(),
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440204',
    'Emily Wilson',
    '+1-555-1004',
    'Nissan Altima',
    'GHI-789',
    true,
    40.7282,
    -73.7949,
    4.7,
    134,
    NOW(),
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440205',
    'Alex Brown',
    '+1-555-1005',
    'Hyundai Elantra',
    'JKL-012',
    true,
    40.7614,
    -73.9776,
    4.5,
    67,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- TEST USERS
-- =============================================

-- Insert test users
INSERT INTO "user_svc"."users" ("id", "email", "password_hash", "name", "phone", "is_active", "created_at", "updated_at") VALUES
('550e8400-e29b-41d4-a716-446655440010', 'john@example.com', '$2b$12$Wf.sBiug6EB6UZz1UPFJLetiK1xmdz4dZDwMNA8szBAifmkAJ2qcu', 'John Doe', '+1-555-0100', TRUE, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440011', 'jane@example.com', '$2b$12$Wf.sBiug6EB6UZz1UPFJLetiK1xmdz4dZDwMNA8szBAifmkAJ2qcu', 'Jane Smith', '+1-555-0101', TRUE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert user addresses
INSERT INTO "user_svc"."user_addresses" ("id", "user_id", "label", "street", "city", "state", "zip_code", "is_default", "created_at", "updated_at") VALUES
-- John Doe's addresses
('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440010', 'Home', '123 Oak Street', 'New York', 'NY', '10001', TRUE, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440302', '550e8400-e29b-41d4-a716-446655440010', 'Work', '456 Business Ave', 'New York', 'NY', '10002', FALSE, NOW(), NOW()),
-- Jane Smith's addresses
('550e8400-e29b-41d4-a716-446655440303', '550e8400-e29b-41d4-a716-446655440011', 'Home', '789 Pine Street', 'Brooklyn', 'NY', '11201', TRUE, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440304', '550e8400-e29b-41d4-a716-446655440011', 'Apartment', '321 Maple Drive', 'Queens', 'NY', '11375', FALSE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

-- Display completion message
DO $$
BEGIN
    RAISE NOTICE 'Mock data insertion completed successfully!';
    RAISE NOTICE 'Inserted: 3 restaurants, 9 menu items, 5 drivers, 2 users, 4 addresses';
END $$;
