-- Mock Data Insertion Script for Food Delivery Microservices
-- Run this script to populate the database with sample data

-- =============================================
-- TEST USERS
-- =============================================

-- Insert test users (customers)
INSERT INTO "user_svc"."users" ("id", "email", "password_hash", "name", "phone", "role", "is_active", "created_at", "updated_at") VALUES
('550e8400-e29b-41d4-a716-446655440010', 'john@example.com', '$2b$12$Wf.sBiug6EB6UZz1UPFJLetiK1xmdz4dZDwMNA8szBAifmkAJ2qcu', 'John Doe', '+1-555-0100', 'customer', TRUE, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440011', 'jane@example.com', '$2b$12$Wf.sBiug6EB6UZz1UPFJLetiK1xmdz4dZDwMNA8szBAifmkAJ2qcu', 'Jane Smith', '+1-555-0101', 'customer', TRUE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert restaurant users (restaurant owners)
INSERT INTO "user_svc"."users" ("id", "email", "password_hash", "name", "phone", "role", "is_active", "created_at", "updated_at") VALUES
('550e8400-e29b-41d4-a716-446655440100', 'mario@pizzapalace.com', '$2b$12$Wf.sBiug6EB6UZz1UPFJLetiK1xmdz4dZDwMNA8szBAifmkAJ2qcu', 'Mario Rossi', '+1-555-0123', 'restaurant', TRUE, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440101', 'burger@junction.com', '$2b$12$Wf.sBiug6EB6UZz1UPFJLetiK1xmdz4dZDwMNA8szBAifmkAJ2qcu', 'Burger Master', '+1-555-0456', 'restaurant', TRUE, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440102', 'thai@garden.com', '$2b$12$Wf.sBiug6EB6UZz1UPFJLetiK1xmdz4dZDwMNA8szBAifmkAJ2qcu', 'Thai Chef', '+1-555-0789', 'restaurant', TRUE, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440103', 'golden@wok.com', '$2b$12$Wf.sBiug6EB6UZz1UPFJLetiK1xmdz4dZDwMNA8szBAifmkAJ2qcu', 'Wok Master', '+1-555-1010', 'restaurant', TRUE, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440104', 'sushi@express.com', '$2b$12$Wf.sBiug6EB6UZz1UPFJLetiK1xmdz4dZDwMNA8szBAifmkAJ2qcu', 'Sushi Chef', '+1-555-2121', 'restaurant', TRUE, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440105', 'taco@fiesta.com', '$2b$12$Wf.sBiug6EB6UZz1UPFJLetiK1xmdz4dZDwMNA8szBAifmkAJ2qcu', 'Taco Master', '+1-555-3333', 'restaurant', TRUE, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440106', 'curry@house.com', '$2b$12$Wf.sBiug6EB6UZz1UPFJLetiK1xmdz4dZDwMNA8szBAifmkAJ2qcu', 'Curry Master', '+1-555-4444', 'restaurant', TRUE, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440107', 'bistro@petit.com', '$2b$12$Wf.sBiug6EB6UZz1UPFJLetiK1xmdz4dZDwMNA8szBAifmkAJ2qcu', 'French Chef', '+1-555-5555', 'restaurant', TRUE, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440108', 'green@leaf.com', '$2b$12$Wf.sBiug6EB6UZz1UPFJLetiK1xmdz4dZDwMNA8szBAifmkAJ2qcu', 'Green Chef', '+1-555-6666', 'restaurant', TRUE, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440109', 'bbq@smoky.com', '$2b$12$Wf.sBiug6EB6UZz1UPFJLetiK1xmdz4dZDwMNA8szBAifmkAJ2qcu', 'BBQ Master', '+1-555-7777', 'restaurant', TRUE, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440110', 'mediterranean@delight.com', '$2b$12$Wf.sBiug6EB6UZz1UPFJLetiK1xmdz4dZDwMNA8szBAifmkAJ2qcu', 'Mediterranean Chef', '+1-555-8888', 'restaurant', TRUE, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440111', 'breakfast@nook.com', '$2b$12$Wf.sBiug6EB6UZz1UPFJLetiK1xmdz4dZDwMNA8szBAifmkAJ2qcu', 'Breakfast Chef', '+1-555-9999', 'restaurant', TRUE, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440112', 'pho@kingdom.com', '$2b$12$Wf.sBiug6EB6UZz1UPFJLetiK1xmdz4dZDwMNA8szBAifmkAJ2qcu', 'Pho Master', '+1-555-1111', 'restaurant', TRUE, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440113', 'seoul@food.com', '$2b$12$Wf.sBiug6EB6UZz1UPFJLetiK1xmdz4dZDwMNA8szBAifmkAJ2qcu', 'Korean Chef', '+1-555-2222', 'restaurant', TRUE, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440114', 'sweet@spot.com', '$2b$12$Wf.sBiug6EB6UZz1UPFJLetiK1xmdz4dZDwMNA8szBAifmkAJ2qcu', 'Dessert Master', '+1-555-3330', 'restaurant', TRUE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert driver users
INSERT INTO "user_svc"."users" ("id", "email", "password_hash", "name", "phone", "role", "is_active", "created_at", "updated_at") VALUES
('550e8400-e29b-41d4-a716-446655440200', 'john.smith@driver.com', '$2b$12$Wf.sBiug6EB6UZz1UPFJLetiK1xmdz4dZDwMNA8szBAifmkAJ2qcu', 'John Smith', '+1-555-1001', 'driver', TRUE, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440201', 'sarah.johnson@driver.com', '$2b$12$Wf.sBiug6EB6UZz1UPFJLetiK1xmdz4dZDwMNA8szBAifmkAJ2qcu', 'Sarah Johnson', '+1-555-1002', 'driver', TRUE, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440202', 'mike.davis@driver.com', '$2b$12$Wf.sBiug6EB6UZz1UPFJLetiK1xmdz4dZDwMNA8szBAifmkAJ2qcu', 'Mike Davis', '+1-555-1003', 'driver', TRUE, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440203', 'emily.wilson@driver.com', '$2b$12$Wf.sBiug6EB6UZz1UPFJLetiK1xmdz4dZDwMNA8szBAifmkAJ2qcu', 'Emily Wilson', '+1-555-1004', 'driver', TRUE, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440204', 'alex.brown@driver.com', '$2b$12$Wf.sBiug6EB6UZz1UPFJLetiK1xmdz4dZDwMNA8szBAifmkAJ2qcu', 'Alex Brown', '+1-555-1005', 'driver', TRUE, NOW(), NOW())
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
-- RESTAURANT SERVICE DATA
-- =============================================

-- Insert sample restaurants
INSERT INTO restaurant_svc.restaurants (
    id, owner_id, name, cuisine, address, phone, rating, delivery_time, delivery_fee,
    is_open, opening_time, closing_time, is_active, image_url, created_at
) VALUES
(
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440100',
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
    'https://images.unsplash.com/photo-1579751626657-72bc17010498?w=800',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440101',
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
    'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440102',
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
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440103',
    'The Golden Wok',
    'Chinese',
    '101 Maple Dr, Suburbia',
    '+1-555-1010',
    4.4,
    '35-45 min',
    2.49,
    true,
    '11:30',
    '21:30',
    true,
    'https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=800',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440104',
    'Sushi Express',
    'Japanese',
    '212 Birch Rd, Lakeside',
    '+1-555-2121',
    4.8,
    '40-50 min',
    4.99,
    true,
    '12:00',
    '22:00',
    true,
    'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440006',
    '550e8400-e29b-41d4-a716-446655440105',
    'Taco Fiesta',
    'Mexican',
    '333 Cedar Blvd, West End',
    '+1-555-3333',
    4.6,
    '20-25 min',
    1.49,
    true,
    '11:00',
    '23:00',
    true,
    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440007',
    '550e8400-e29b-41d4-a716-446655440106',
    'The Curry House',
    'Indian',
    '444 Spruce Ave, Eastville',
    '+1-555-4444',
    4.9,
    '45-55 min',
    3.99,
    true,
    '17:00',
    '22:00',
    true,
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440008',
    '550e8400-e29b-41d4-a716-446655440107',
    'Le Petit Bistro',
    'French',
    '555 Willow Ln, Old Town',
    '+1-555-5555',
    4.3,
    '50-60 min',
    5.99,
    false,
    '18:00',
    '23:00',
    true,
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440009',
    '550e8400-e29b-41d4-a716-446655440108',
    'The Green Leaf',
    'Vegan',
    '666 Elm St, Greenfield',
    '+1-555-6666',
    4.7,
    '25-35 min',
    2.99,
    true,
    '11:00',
    '20:00',
    true,
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440109',
    'Smoky Barrel BBQ',
    'BBQ',
    '777 Hickory Rd, Riverside',
    '+1-555-7777',
    4.5,
    '30-40 min',
    3.49,
    true,
    '12:00',
    '21:00',
    true,
    'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440011',
    '550e8400-e29b-41d4-a716-446655440110',
    'Mediterranean Delight',
    'Mediterranean',
    '888 Olive Grove, Hilltop',
    '+1-555-8888',
    4.6,
    '35-45 min',
    2.99,
    true,
    '11:30',
    '22:30',
    true,
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440012',
    '550e8400-e29b-41d4-a716-446655440111',
    'The Breakfast Nook',
    'Breakfast',
    '999 Sunrise Ct, Morningside',
    '+1-555-9999',
    4.8,
    '15-25 min',
    1.99,
    true,
    '07:00',
    '14:00',
    true,
    'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440013',
    '550e8400-e29b-41d4-a716-446655440112',
    'Pho Kingdom',
    'Vietnamese',
    '111 Lotus St, Little Saigon',
    '+1-555-1111',
    4.7,
    '30-40 min',
    2.49,
    true,
    '11:00',
    '21:00',
    true,
    'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440014',
    '550e8400-e29b-41d4-a716-446655440113',
    'Seoul Food',
    'Korean',
    '222 Kimchi Ave, Koreatown',
    '+1-555-2222',
    4.6,
    '35-45 min',
    3.99,
    true,
    '12:00',
    '22:00',
    true,
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440015',
    '550e8400-e29b-41d4-a716-446655440114',
    'The Sweet Spot',
    'Desserts',
    '333 Sugar Lane, Sweetwater',
    '+1-555-3330',
    4.9,
    '20-30 min',
    1.99,
    true,
    '13:00',
    '23:00',
    true,
    'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800',
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Insert sample menu items
INSERT INTO restaurant_svc.menu_items (
    id, restaurant_id, name, description, price, category,
    is_available, preparation_time, image_url, created_at
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
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500',
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
    'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500',
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
    'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440110',
    '550e8400-e29b-41d4-a716-446655440001',
    'Spaghetti Carbonara',
    'Spaghetti with pancetta, eggs, and parmesan cheese',
    15.99,
    'pasta',
    true,
    18,
    'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440111',
    '550e8400-e29b-41d4-a716-446655440001',
    'Garlic Bread',
    'Toasted bread with garlic butter and herbs',
    5.99,
    'appetizer',
    true,
    8,
    'https://images.unsplash.com/photo-1573140401552-388e8f45f1df?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440112',
    '550e8400-e29b-41d4-a716-446655440001',
    'Tiramisu',
    'Classic Italian dessert with coffee and mascarpone',
    7.99,
    'dessert',
    true,
    5,
    'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440113',
    '550e8400-e29b-41d4-a716-446655440001',
    'Fettuccine Alfredo',
    'Creamy parmesan sauce with fettuccine pasta',
    14.99,
    'pasta',
    true,
    16,
    'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440114',
    '550e8400-e29b-41d4-a716-446655440001',
    'Meatball Sub',
    'Submarine sandwich with meatballs, marinara sauce, and cheese',
    11.99,
    'sandwich',
    true,
    12,
    'https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440115',
    '550e8400-e29b-41d4-a716-446655440001',
    'Minestrone Soup',
    'Hearty vegetable soup',
    6.99,
    'soup',
    true,
    10,
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440116',
    '550e8400-e29b-41d4-a716-446655440001',
    'Bruschetta',
    'Toasted bread with tomatoes, garlic, and basil',
    7.99,
    'appetizer',
    true,
    8,
    'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=500',
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
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500',
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
    'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=500',
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
    'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440117',
    '550e8400-e29b-41d4-a716-446655440002',
    'Onion Rings',
    'Battered and fried onion rings',
    5.99,
    'sides',
    true,
    10,
    'https://images.unsplash.com/photo-1639024471283-03518883512d?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440118',
    '550e8400-e29b-41d4-a716-446655440002',
    'Chocolate Milkshake',
    'Thick and creamy chocolate milkshake',
    6.99,
    'drinks',
    true,
    5,
    'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440119',
    '550e8400-e29b-41d4-a716-446655440002',
    'Grilled Chicken Sandwich',
    'Grilled chicken breast with lettuce, tomato, and mayo',
    10.99,
    'sandwich',
    true,
    14,
    'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440120',
    '550e8400-e29b-41d4-a716-446655440002',
    'Veggie Burger',
    'Plant-based patty with all the fixings',
    10.99,
    'burger',
    true,
    12,
    'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440121',
    '550e8400-e29b-41d4-a716-446655440002',
    'Chili Cheese Fries',
    'Fries topped with chili and cheese',
    7.99,
    'sides',
    true,
    12,
    'https://images.unsplash.com/photo-1630431341973-02e1f662fd46?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440122',
    '550e8400-e29b-41d4-a716-446655440002',
    'Hot Dog',
    'Classic all-beef hot dog on a bun',
    6.99,
    'main',
    true,
    10,
    'https://images.unsplash.com/photo-1612392062798-2dbee80e0566?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440123',
    '550e8400-e29b-41d4-a716-446655440002',
    'Caesar Salad',
    'Romaine lettuce with Caesar dressing, croutons, and parmesan',
    8.99,
    'salad',
    true,
    8,
    'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=500',
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
    'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=500',
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
    'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=500',
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
    'https://images.unsplash.com/photo-1594007653729-c5b5ddfe77c9?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440124',
    '550e8400-e29b-41d4-a716-446655440003',
    'Tom Yum Soup',
    'Hot and sour soup with shrimp',
    7.99,
    'soup',
    true,
    15,
    'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440125',
    '550e8400-e29b-41d4-a716-446655440003',
    'Mango Sticky Rice',
    'Sweet sticky rice with fresh mango',
    8.99,
    'dessert',
    true,
    12,
    'https://images.unsplash.com/photo-1620641021611-ee1feb91c3d0?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440126',
    '550e8400-e29b-41d4-a716-446655440003',
    'Red Curry',
    'Spicy red curry with beef and bamboo shoots',
    15.99,
    'curry',
    true,
    18,
    'https://images.unsplash.com/photo-1604908816595-094177eb7ddc?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440127',
    '550e8400-e29b-41d4-a716-446655440003',
    'Drunken Noodles',
    'Spicy stir-fried noodles with basil and chicken',
    13.99,
    'noodles',
    true,
    20,
    'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440128',
    '550e8400-e29b-41d4-a716-446655440003',
    'Chicken Satay',
    'Grilled chicken skewers with peanut sauce',
    9.99,
    'appetizer',
    true,
    15,
    'https://images.unsplash.com/photo-1609501676725-7186f017a4b7?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440129',
    '550e8400-e29b-41d4-a716-446655440003',
    'Pineapple Fried Rice',
    'Fried rice with shrimp, pineapple, and cashews',
    14.99,
    'rice',
    true,
    16,
    'https://images.unsplash.com/photo-1633508388457-0da02c793bc6?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440130',
    '550e8400-e29b-41d4-a716-446655440003',
    'Thai Iced Tea',
    'Sweet and creamy Thai iced tea',
    4.99,
    'drinks',
    true,
    5,
    'https://images.unsplash.com/photo-1641890887458-8eb66df0df2a?w=500',
    NOW()
),

-- The Golden Wok menu
(
    '550e8400-e29b-41d4-a716-446655440131',
    '550e8400-e29b-41d4-a716-446655440004',
    'General Tso''s Chicken',
    'Sweet and spicy deep-fried chicken',
    13.99,
    'main',
    true,
    18,
    'https://images.unsplash.com/photo-1606850780554-b55ea4dd0b70?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440132',
    '550e8400-e29b-41d4-a716-446655440004',
    'Egg Drop Soup',
    'Wispy beaten eggs in boiled chicken broth',
    4.99,
    'soup',
    true,
    10,
    'https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440133',
    '550e8400-e29b-41d4-a716-446655440004',
    'Beef and Broccoli',
    'Stir-fried beef with broccoli in a ginger soy sauce',
    14.99,
    'main',
    true,
    16,
    'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440134',
    '550e8400-e29b-41d4-a716-446655440004',
    'Pork Fried Rice',
    'Fried rice with pork, egg, and vegetables',
    11.99,
    'rice',
    true,
    15,
    'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440135',
    '550e8400-e29b-41d4-a716-446655440004',
    'Sweet and Sour Pork',
    'Deep-fried pork with a sweet and sour sauce',
    13.99,
    'main',
    true,
    18,
    'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440136',
    '550e8400-e29b-41d4-a716-446655440004',
    'Hot and Sour Soup',
    'Spicy and sour soup with mushrooms and tofu',
    5.99,
    'soup',
    true,
    12,
    'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440137',
    '550e8400-e29b-41d4-a716-446655440004',
    'Crab Rangoon',
    'Fried wontons filled with crab and cream cheese',
    7.99,
    'appetizer',
    true,
    12,
    'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440138',
    '550e8400-e29b-41d4-a716-446655440004',
    'Lo Mein',
    'Stir-fried noodles with vegetables and a choice of protein',
    12.99,
    'noodles',
    true,
    15,
    'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440139',
    '550e8400-e29b-41d4-a716-446655440004',
    'Orange Chicken',
    'Crispy chicken in a sweet and tangy orange sauce',
    13.99,
    'main',
    true,
    18,
    'https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440140',
    '550e8400-e29b-41d4-a716-446655440004',
    'Spring Rolls',
    'Crispy vegetable spring rolls',
    6.99,
    'appetizer',
    true,
    10,
    'https://images.unsplash.com/photo-1619523689018-82c7e8196d09?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440201',
    '550e8400-e29b-41d4-a716-446655440005',
    'California Roll',
    'Crab meat, avocado, and cucumber',
    8.99,
    'sushi',
    true,
    10,
    'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440202',
    '550e8400-e29b-41d4-a716-446655440005',
    'Spicy Tuna Roll',
    'Tuna with spicy mayo and cucumber',
    9.99,
    'sushi',
    true,
    12,
    'https://images.unsplash.com/photo-1617196034183-421b4917c92d?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440203',
    '550e8400-e29b-41d4-a716-446655440005',
    'Dragon Roll',
    'Eel and cucumber topped with avocado and eel sauce',
    14.99,
    'sushi',
    true,
    15,
    'https://images.unsplash.com/photo-1563612116625-3012372fccce?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440204',
    '550e8400-e29b-41d4-a716-446655440005',
    'Salmon Nigiri',
    'Slice of fresh salmon over sushi rice',
    6.99,
    'nigiri',
    true,
    8,
    'https://images.unsplash.com/photo-1617196035154-b35c7926f99a?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440205',
    '550e8400-e29b-41d4-a716-446655440005',
    'Tuna Sashimi',
    'Thick slices of fresh raw tuna',
    15.99,
    'sashimi',
    true,
    10,
    'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440206',
    '550e8400-e29b-41d4-a716-446655440005',
    'Edamame',
    'Steamed soybeans with sea salt',
    4.99,
    'appetizer',
    true,
    5,
    'https://images.unsplash.com/photo-1607301405945-f40f2c1b888e?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440207',
    '550e8400-e29b-41d4-a716-446655440005',
    'Miso Soup',
    'Traditional Japanese soup with tofu, seaweed, and scallions',
    3.99,
    'soup',
    true,
    5,
    'https://images.unsplash.com/photo-1606850780554-b55ea4dd0b70?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440208',
    '550e8400-e29b-41d4-a716-446655440005',
    'Seaweed Salad',
    'Classic seaweed salad with a sesame dressing',
    6.99,
    'salad',
    true,
    7,
    'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440209',
    '550e8400-e29b-41d4-a716-446655440005',
    'Chicken Teriyaki',
    'Grilled chicken with teriyaki sauce, served with rice',
    16.99,
    'main',
    true,
    20,
    'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440210',
    '550e8400-e29b-41d4-a716-446655440005',
    'Shrimp Tempura',
    'Lightly battered and deep-fried shrimp and vegetables',
    12.99,
    'appetizer',
    true,
    15,
    'https://images.unsplash.com/photo-1576777647209-e8733c0b16c9?w=500',
    NOW()
),

-- Taco Fiesta menu
(
    '550e8400-e29b-41d4-a716-446655440211',
    '550e8400-e29b-41d4-a716-446655440006',
    'Carne Asada Tacos',
    'Grilled steak tacos with onion and cilantro',
    3.99,
    'tacos',
    true,
    10,
    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440212',
    '550e8400-e29b-41d4-a716-446655440006',
    'Al Pastor Tacos',
    'Marinated pork tacos with pineapple',
    3.99,
    'tacos',
    true,
    10,
    'https://images.unsplash.com/photo-1614647457818-2037f5d79e08?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440213',
    '550e8400-e29b-41d4-a716-446655440006',
    'Chicken Burrito',
    'Large flour tortilla with chicken, rice, beans, and cheese',
    11.99,
    'burrito',
    true,
    12,
    'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440214',
    '550e8400-e29b-41d4-a716-446655440006',
    'Cheese Quesadilla',
    'Grilled tortilla with melted cheese',
    8.99,
    'quesadilla',
    true,
    8,
    'https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440215',
    '550e8400-e29b-41d4-a716-446655440006',
    'Chips and Guacamole',
    'Freshly made guacamole with crispy tortilla chips',
    7.99,
    'appetizer',
    true,
    7,
    'https://images.unsplash.com/photo-1628502459046-e39a96f6f48b?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440216',
    '550e8400-e29b-41d4-a716-446655440006',
    'Nachos Supreme',
    'Chips topped with beef, cheese, beans, sour cream, and jalapeños',
    13.99,
    'appetizer',
    true,
    15,
    'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440217',
    '550e8400-e29b-41d4-a716-446655440006',
    'Horchata',
    'Sweet rice milk drink with cinnamon',
    3.49,
    'drinks',
    true,
    3,
    'https://images.unsplash.com/photo-1664209220780-088b3e5a0287?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440218',
    '550e8400-e29b-41d4-a716-446655440006',
    'Street Corn (Elote)',
    'Grilled corn on the cob with mayo, cotija cheese, and chili powder',
    5.99,
    'sides',
    true,
    10,
    'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440219',
    '550e8400-e29b-41d4-a716-446655440006',
    'Fish Tacos',
    'Battered fish with cabbage slaw and chipotle mayo',
    4.49,
    'tacos',
    true,
    12,
    'https://images.unsplash.com/photo-1615870123253-df99e8c7a55d?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440220',
    '550e8400-e29b-41d4-a716-446655440006',
    'Churros',
    'Fried dough pastry with cinnamon sugar',
    5.99,
    'dessert',
    true,
    8,
    'https://images.unsplash.com/photo-1626790680787-de5e9a07bcf2?w=500',
    NOW()
),

-- The Curry House menu
(
    '550e8400-e29b-41d4-a716-446655440221',
    '550e8400-e29b-41d4-a716-446655440007',
    'Chicken Tikka Masala',
    'Grilled chicken chunks in a spiced curry sauce',
    16.99,
    'curry',
    true,
    25,
    'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440222',
    '550e8400-e29b-41d4-a716-446655440007',
    'Butter Chicken',
    'Tender chicken in a mildly spiced tomato sauce',
    16.99,
    'curry',
    true,
    25,
    'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440223',
    '550e8400-e29b-41d4-a716-446655440007',
    'Lamb Vindaloo',
    'Spicy lamb curry with potatoes',
    18.99,
    'curry',
    true,
    30,
    'https://images.unsplash.com/photo-1639744093009-81f32a5b69e7?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440224',
    '550e8400-e29b-41d4-a716-446655440007',
    'Vegetable Samosas',
    'Crispy pastry filled with spiced potatoes and peas',
    6.99,
    'appetizer',
    true,
    15,
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440225',
    '550e8400-e29b-41d4-a716-446655440007',
    'Garlic Naan',
    'Soft flatbread with garlic and butter',
    3.99,
    'bread',
    true,
    10,
    'https://images.unsplash.com/photo-1628265820616-e28a96a49c7c?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440226',
    '550e8400-e29b-41d4-a716-446655440007',
    'Basmati Rice',
    'Steamed long-grain rice',
    3.49,
    'sides',
    true,
    10,
    'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440227',
    '550e8400-e29b-41d4-a716-446655440007',
    'Mango Lassi',
    'Yogurt-based mango milkshake',
    4.99,
    'drinks',
    true,
    5,
    'https://images.unsplash.com/photo-1547558840-8ad9609e4dbd?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440228',
    '550e8400-e29b-41d4-a716-446655440007',
    'Chana Masala',
    'Spicy chickpea curry',
    13.99,
    'curry',
    true,
    20,
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440229',
    '550e8400-e29b-41d4-a716-446655440007',
    'Palak Paneer',
    'Indian cheese in a creamy spinach sauce',
    14.99,
    'curry',
    true,
    22,
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440230',
    '550e8400-e29b-41d4-a716-446655440007',
    'Chicken Biryani',
    'Aromatic rice dish with chicken and spices',
    17.99,
    'rice',
    true,
    30,
    'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500',
    NOW()
),

-- Le Petit Bistro menu
(
    '550e8400-e29b-41d4-a716-446655440231',
    '550e8400-e29b-41d4-a716-446655440008',
    'French Onion Soup',
    'Rich beef broth with caramelized onions, topped with cheese toast',
    9.99,
    'soup',
    true,
    20,
    'https://images.unsplash.com/photo-1601072649252-1a340c8a26e5?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440232',
    '550e8400-e29b-41d4-a716-446655440008',
    'Steak Frites',
    'Grilled steak with a side of french fries',
    28.99,
    'main',
    true,
    25,
    'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440233',
    '550e8400-e29b-41d4-a716-446655440008',
    'Coq au Vin',
    'Chicken braised with wine, mushrooms, and bacon',
    25.99,
    'main',
    true,
    40,
    'https://images.unsplash.com/photo-1587314156493-baa74df8f0ea?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440234',
    '550e8400-e29b-41d4-a716-446655440008',
    'Crème Brûlée',
    'Rich custard base topped with a layer of hardened caramelized sugar',
    8.99,
    'dessert',
    true,
    10,
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440235',
    '550e8400-e29b-41d4-a716-446655440008',
    'Escargots de Bourgogne',
    'Snails baked in garlic-herb butter',
    12.99,
    'appetizer',
    true,
    18,
    'https://images.unsplash.com/photo-1619096252214-ef06c45683e3?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440236',
    '550e8400-e29b-41d4-a716-446655440008',
    'Duck Confit',
    'Salt-cured duck leg cooked in its own fat until tender',
    29.99,
    'main',
    true,
    35,
    'https://images.unsplash.com/photo-1608441880776-0282e4a9b7c2?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440237',
    '550e8400-e29b-41d4-a716-446655440008',
    'Salade Niçoise',
    'Salad with tomatoes, tuna, hard-boiled eggs, olives, and anchovies',
    17.99,
    'salad',
    true,
    15,
    'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440238',
    '550e8400-e29b-41d4-a716-446655440008',
    'Beef Bourguignon',
    'Beef stew braised in red wine, with mushrooms and pearl onions',
    27.99,
    'main',
    true,
    45,
    'https://images.unsplash.com/photo-1564834744159-ff0ea41ba4b9?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440239',
    '550e8400-e29b-41d4-a716-446655440008',
    'Chocolate Mousse',
    'Light and airy dark chocolate mousse',
    9.99,
    'dessert',
    true,
    10,
    'https://images.unsplash.com/photo-1614699099487-34c3d85bb992?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440240',
    '550e8400-e29b-41d4-a716-446655440008',
    'Baguette with Butter',
    'Freshly baked baguette served with high-quality butter',
    5.99,
    'sides',
    true,
    5,
    'https://images.unsplash.com/photo-1541529086526-db283c563270?w=500',
    NOW()
),

-- ... And so on for the remaining restaurants:
-- The Green Leaf (Vegan)
-- Smoky Barrel BBQ (BBQ)
-- Mediterranean Delight (Mediterranean)
-- The Breakfast Nook (Breakfast)
-- Pho Kingdom (Vietnamese)
-- Seoul Food (Korean)
-- The Sweet Spot (Desserts)
(
    '550e8400-e29b-41d4-a716-446655440241',
    '550e8400-e29b-41d4-a716-446655440009',
    'Quinoa Power Bowl',
    'Quinoa with roasted vegetables, avocado, and a lemon-tahini dressing',
    14.99,
    'bowl',
    true,
    15,
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440242',
    '550e8400-e29b-41d4-a716-446655440009',
    'Black Bean Burger',
    'Homemade black bean patty on a whole wheat bun with vegan mayo',
    13.99,
    'burger',
    true,
    18,
    'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440243',
    '550e8400-e29b-41d4-a716-446655440009',
    'Lentil Shepherd''s Pie',
    'Lentil and vegetable base topped with mashed sweet potatoes',
    15.99,
    'main',
    true,
    25,
    'https://images.unsplash.com/photo-1585908968640-d84ba96b1152?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440244',
    '550e8400-e29b-41d4-a716-446655440009',
    'Hummus and Pita Plate',
    'Creamy hummus served with warm pita bread and fresh vegetables',
    9.99,
    'appetizer',
    true,
    10,
    'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440245',
    '550e8400-e29b-41d4-a716-446655440009',
    'Avocado Chocolate Mousse',
    'Rich and creamy mousse made from avocado and cocoa',
    7.99,
    'dessert',
    true,
    10,
    'https://images.unsplash.com/photo-1592329347687-5c4d5e0c9c1d?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440246',
    '550e8400-e29b-41d4-a716-446655440010',
    'Pulled Pork Sandwich',
    'Slow-smoked pulled pork on a brioche bun with coleslaw',
    12.99,
    'sandwich',
    true,
    15,
    'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440247',
    '550e8400-e29b-41d4-a716-446655440010',
    'Beef Brisket Plate',
    'Sliced beef brisket served with two sides',
    22.99,
    'plate',
    true,
    20,
    'https://images.unsplash.com/photo-1548940740-204726a19be3?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440248',
    '550e8400-e29b-41d4-a716-446655440010',
    'St. Louis Style Ribs (Half Rack)',
    'Half rack of slow-smoked pork ribs with BBQ sauce',
    18.99,
    'ribs',
    true,
    25,
    'https://images.unsplash.com/photo-1546457856-b58d9072e59a?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440249',
    '550e8400-e29b-41d4-a716-446655440010',
    'Mac and Cheese',
    'Creamy, cheesy macaroni',
    5.99,
    'sides',
    true,
    12,
    'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440250',
    '550e8400-e29b-41d4-a716-446655440010',
    'Cornbread',
    'Sweet and moist cornbread with honey butter',
    3.99,
    'sides',
    true,
    10,
    'https://images.unsplash.com/photo-1564651705501-98035e85265a?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440251',
    '550e8400-e29b-41d4-a716-446655440011',
    'Gyro Platter',
    'Lamb and beef gyro meat served with pita, tzatziki, and salad',
    15.99,
    'platter',
    true,
    18,
    'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440252',
    '550e8400-e29b-41d4-a716-446655440011',
    'Chicken Shawarma Wrap',
    'Marinated chicken in a pita wrap with garlic sauce and pickles',
    12.99,
    'wrap',
    true,
    15,
    'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440253',
    '550e8400-e29b-41d4-a716-446655440011',
    'Falafel Appetizer',
    'Deep-fried chickpea patties with tahini sauce',
    8.99,
    'appetizer',
    true,
    12,
    'https://images.unsplash.com/photo-1601644381175-2d4ab33ec46a?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440254',
    '550e8400-e29b-41d4-a716-446655440011',
    'Hummus with Pita',
    'Classic chickpea dip with olive oil and warm pita bread',
    7.99,
    'appetizer',
    true,
    8,
    'https://images.unsplash.com/photo-1618897996318-5a901fa6ca71?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440255',
    '550e8400-e29b-41d4-a716-446655440011',
    'Baklava',
    'Sweet pastry made of layers of filo filled with chopped nuts',
    4.99,
    'dessert',
    true,
    5,
    'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440256',
    '550e8400-e29b-41d4-a716-446655440012',
    'Classic Pancakes',
    'Stack of three buttermilk pancakes with syrup and butter',
    9.99,
    'pancakes',
    true,
    12,
    'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440257',
    '550e8400-e29b-41d4-a716-446655440012',
    'Eggs Benedict',
    'Poached eggs and Canadian bacon on an English muffin, topped with hollandaise',
    13.99,
    'eggs',
    true,
    15,
    'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440258',
    '550e8400-e29b-41d4-a716-446655440012',
    'Breakfast Burrito',
    'Scrambled eggs, sausage, potatoes, and cheese in a flour tortilla',
    11.99,
    'burrito',
    true,
    14,
    'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440259',
    '550e8400-e29b-41d4-a716-446655440012',
    'Side of Bacon',
    'Three crispy strips of bacon',
    4.99,
    'sides',
    true,
    8,
    'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440260',
    '550e8400-e29b-41d4-a716-446655440012',
    'Fresh Orange Juice',
    'Freshly squeezed orange juice',
    4.49,
    'drinks',
    true,
    4,
    'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440261',
    '550e8400-e29b-41d4-a716-446655440013',
    'Pho Dac Biet (Combination Beef Noodle Soup)',
    'Beef noodle soup with brisket, flank, tendon, and meatball',
    14.99,
    'pho',
    true,
    20,
    'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440262',
    '550e8400-e29b-41d4-a716-446655440013',
    'Goi Cuon (Fresh Spring Rolls)',
    'Shrimp, pork, and vermicelli wrapped in rice paper with peanut sauce',
    7.99,
    'appetizer',
    true,
    12,
    'https://images.unsplash.com/photo-1594007653729-c5b5ddfe77c9?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440263',
    '550e8400-e29b-41d4-a716-446655440013',
    'Banh Mi Thit Nuong (Grilled Pork Sandwich)',
    'Grilled pork in a baguette with pickled vegetables, cilantro, and jalapeño',
    9.99,
    'sandwich',
    true,
    15,
    'https://images.unsplash.com/photo-1576564878684-5e89f0f05871?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440264',
    '550e8400-e29b-41d4-a716-446655440013',
    'Bun Thit Nuong (Grilled Pork with Vermicelli)',
    'Vermicelli noodles with grilled pork, fresh herbs, and fish sauce',
    13.99,
    'noodles',
    true,
    18,
    'https://images.unsplash.com/photo-1559847844-5315695dadae?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440265',
    '550e8400-e29b-41d4-a716-446655440013',
    'Ca Phe Sua Da (Vietnamese Iced Coffee)',
    'Strong iced coffee with sweetened condensed milk',
    5.49,
    'drinks',
    true,
    7,
    'https://images.unsplash.com/photo-1575046786296-dc037b4b7be7?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440266',
    '550e8400-e29b-41d4-a716-446655440014',
    'Bibimbap',
    'Rice bowl with assorted vegetables, beef, and a fried egg',
    15.99,
    'rice',
    true,
    18,
    'https://images.unsplash.com/photo-1553621042-f6e147245754?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440267',
    '550e8400-e29b-41d4-a716-446655440014',
    'Beef Bulgogi',
    'Thinly sliced marinated beef, grilled to perfection',
    18.99,
    'main',
    true,
    20,
    'https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440268',
    '550e8400-e29b-41d4-a716-446655440014',
    'Kimchi Jjigae (Kimchi Stew)',
    'Spicy stew made with kimchi, tofu, and pork',
    14.99,
    'stew',
    true,
    22,
    'https://images.unsplash.com/photo-1598511726623-d2e9996892f0?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440269',
    '550e8400-e29b-41d4-a716-446655440014',
    'Korean Fried Chicken (Half)',
    'Crispy and juicy fried chicken with a sweet and spicy sauce',
    16.99,
    'chicken',
    true,
    25,
    'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440270',
    '550e8400-e29b-41d4-a716-446655440014',
    'Japchae (Glass Noodle Stir Fry)',
    'Sweet potato starch noodles stir-fried with vegetables and beef',
    14.99,
    'noodles',
    true,
    18,
    'https://images.unsplash.com/photo-1600877992624-3c90d7f484f6?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440271',
    '550e8400-e29b-41d4-a716-446655440015',
    'Chocolate Lava Cake',
    'Warm chocolate cake with a gooey molten center, served with vanilla ice cream',
    9.99,
    'cake',
    true,
    15,
    'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440272',
    '550e8400-e29b-41d4-a716-446655440015',
    'New York Cheesecake',
    'Classic cheesecake with a graham cracker crust',
    8.99,
    'cake',
    true,
    8,
    'https://images.unsplash.com/photo-1533134486753-c833f0ed4866?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440273',
    '550e8400-e29b-41d4-a716-446655440015',
    'Classic Ice Cream Sundae',
    'Two scoops of ice cream with hot fudge, whipped cream, and a cherry',
    10.99,
    'ice cream',
    true,
    10,
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440274',
    '550e8400-e29b-41d4-a716-446655440015',
    'Apple Pie a La Mode',
    'Warm apple pie served with a scoop of vanilla ice cream',
    8.99,
    'pie',
    true,
    12,
    'https://images.unsplash.com/photo-1535920527002-b35e96722eb9?w=500',
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440275',
    '550e8400-e29b-41d4-a716-446655440015',
    'Oreo Milkshake',
    'Thick milkshake blended with Oreo cookies',
    7.99,
    'drinks',
    true,
    7,
    'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=500',
    NOW()
)

ON CONFLICT (id) DO NOTHING;

-- =============================================
-- DELIVERY SERVICE DATA
-- =============================================

-- Insert sample drivers
-- NOTE: driver.id now equals user.id (shared primary key pattern)
INSERT INTO delivery_svc.drivers (
    id, name, phone, vehicle, license_plate, is_available,
    current_location_lat, current_location_lng, rating, total_deliveries,
    created_at, updated_at
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440200',  -- Same as user ID (John Smith)
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
    '550e8400-e29b-41d4-a716-446655440201',  -- Same as user ID (Sarah Johnson)
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
    '550e8400-e29b-41d4-a716-446655440202',  -- Same as user ID (Mike Davis)
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
    '550e8400-e29b-41d4-a716-446655440203',  -- Same as user ID (Emily Wilson)
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
    '550e8400-e29b-41d4-a716-446655440204',  -- Same as user ID (Alex Brown)
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
-- COMPLETION MESSAGE
-- =============================================

-- Display completion message
DO $$
BEGIN
    RAISE NOTICE 'Mock data insertion completed successfully!';
    RAISE NOTICE 'Inserted: 15 restaurants, 15 restaurant users, 5 drivers, 5 driver users, 2 customer users, 4 addresses';
    RAISE NOTICE 'Referential integrity handled at application level (microservices best practice)';
END $$;
