/*
  # Create emptyleg_offers table

  1. New Tables
    - `emptyleg_offers` - Stores empty leg flight offers
      - `id` (text, primary key)
      - `departure_date` (text)
      - `origin` (text)
      - `destination` (text)
      - `aircraft_model` (text)
      - `aircraft_category` (text)
      - `capacity` (bigint)
      - `price` (bigint)
      - `title` (text)
      - `description` (text)
      - `currency` (text)
      - `duration` (text)
      - `is_featured` (boolean)
      - `is_empty_leg` (boolean)
      - `created_at` (timestamptz)
      - `image_url` (text)
*/

-- Create emptyleg_offers table
CREATE TABLE IF NOT EXISTS emptyleg_offers (
  id text PRIMARY KEY,
  departure_date text,
  origin text,
  destination text,
  aircraft_model text,
  aircraft_category text,
  capacity bigint,
  price bigint,
  title text,
  description text,
  currency text,
  duration text,
  is_featured boolean,
  is_empty_leg boolean,
  created_at timestamptz,
  image_url text
);

-- Add comment to table
COMMENT ON TABLE emptyleg_offers IS 'emptylegs privatecharterx';

-- Enable RLS
ALTER TABLE emptyleg_offers ENABLE ROW LEVEL SECURITY;

-- Insert sample data
INSERT INTO emptyleg_offers (
  id, 
  departure_date, 
  origin, 
  destination, 
  aircraft_model, 
  aircraft_category, 
  capacity, 
  price, 
  title, 
  description, 
  currency, 
  duration, 
  is_featured, 
  is_empty_leg,
  created_at,
  image_url
)
VALUES 
  (
    'el-001',
    '2025-05-15',
    'Zurich (ZRH)',
    'London (LTN)',
    'Citation XLS+',
    'Light Jet',
    8,
    4500,
    'Empty Leg: Zurich to London',
    'Take advantage of this exclusive empty leg flight from Zurich to London at a fraction of the regular charter price. This flight is available due to an aircraft repositioning and offers exceptional value for flexible travelers.',
    '€',
    '1h 30m',
    false,
    true,
    now(),
    'https://images.unsplash.com/photo-1494412651409-8963ce7935a7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80'
  ),
  (
    'el-002',
    '2025-05-20',
    'Nice (NCE)',
    'Paris (LBG)',
    'Embraer Phenom 300',
    'Light Jet',
    7,
    3800,
    'Empty Leg: Nice to Paris',
    'Seize this opportunity to fly from Nice to Paris on a luxury private jet at a significantly reduced price. This empty leg flight is available due to aircraft repositioning and offers exceptional value.',
    '€',
    '1h 15m',
    true,
    true,
    now(),
    'https://images.unsplash.com/photo-1507666664345-c49223375e33?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80'
  ),
  (
    'el-003',
    '2025-06-05',
    'Miami (OPF)',
    'New York (TEB)',
    'Challenger 350',
    'Super Midsize',
    9,
    12000,
    'Empty Leg: Miami to New York',
    'Take advantage of this premium empty leg flight from Miami to New York at a substantial discount. This is an excellent opportunity to experience private jet travel at a fraction of the usual cost.',
    '$',
    '2h 45m',
    false,
    true,
    now(),
    'https://images.unsplash.com/photo-1507666664345-c49223375e33?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80'
  ),
  (
    'el-004',
    '2025-06-10',
    'Geneva (GVA)',
    'Rome (CIA)',
    'Citation CJ4',
    'Light Jet',
    8,
    5200,
    'Empty Leg: Geneva to Rome',
    'Enjoy this exclusive empty leg flight from Geneva to Rome at a special rate. Perfect for a spontaneous Italian getaway with all the comfort and convenience of private aviation.',
    '€',
    '1h 45m',
    false,
    true,
    now(),
    'https://images.unsplash.com/photo-1583373834259-46cc92173cb7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2574&q=80'
  ),
  (
    'el-005',
    '2025-06-15',
    'London (LTN)',
    'Ibiza (IBZ)',
    'Legacy 500',
    'Midsize Jet',
    10,
    7800,
    'Empty Leg: London to Ibiza',
    'Start your Ibiza vacation in style with this empty leg flight from London. Enjoy the spacious cabin and premium service at a fraction of the regular charter price.',
    '€',
    '2h 30m',
    true,
    true,
    now(),
    'https://images.unsplash.com/photo-1540962351504-03099e0a754b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2574&q=80'
  );