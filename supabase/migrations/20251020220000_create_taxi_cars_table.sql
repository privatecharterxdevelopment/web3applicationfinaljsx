-- Create taxi_cars table for taxi/concierge service
-- Based on TaxiConciergeView.jsx carTypes data

CREATE TABLE IF NOT EXISTS taxi_cars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  car_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  year INTEGER,
  seats INTEGER NOT NULL,
  price_min_chf DECIMAL(10, 2) NOT NULL,
  price_max_chf DECIMAL(10, 2) NOT NULL,
  hourly_rate DECIMAL(10, 2),
  daily_rate DECIMAL(10, 2),
  image_url TEXT,
  description TEXT,
  features TEXT[],
  category TEXT,
  available BOOLEAN DEFAULT true,
  base_location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the 5 cars from TaxiConciergeView.jsx
INSERT INTO taxi_cars (car_id, name, brand, model, year, seats, price_min_chf, price_max_chf, image_url, description, category) VALUES
(
  'bmw-7er-2015',
  'BMW 7er 2015',
  'BMW',
  '7 Series',
  2015,
  4,
  4.00,
  7.50,
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/uber%20imgs/sl_251110158_bmw-7-2015-seitenansicht_4x.png',
  'Compact and efficient luxury sedan, perfect for business travel',
  'luxury-sedan'
),
(
  'mercedes-s-2018',
  'Mercedes Benz S-Class 2018',
  'Mercedes-Benz',
  'S-Class',
  2018,
  5,
  4.50,
  7.50,
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/uber%20imgs/sl_253116175_mercedes-benz-s-2018-seitenansicht_4x.png',
  'Premium luxury sedan with exceptional comfort and technology',
  'luxury-sedan'
),
(
  'mercedes-s-2020',
  'Mercedes S-Class 2020',
  'Mercedes-Benz',
  'S-Class',
  2020,
  5,
  5.00,
  8.00,
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/uber%20imgs/sl_253111171_mercedes-benz-s-2020-seitenansicht_4x.png',
  'Latest generation S-Class with cutting-edge luxury and innovation',
  'luxury-sedan'
),
(
  'mercedes-vito',
  'Mercedes Vito',
  'Mercedes-Benz',
  'Vito',
  NULL,
  7,
  6.50,
  9.00,
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/uber%20imgs/vito.jpg',
  'Spacious luxury van, ideal for group transfers and family travel',
  'luxury-van'
),
(
  'mercedes-maybach',
  'Mercedes Benz S-Class Maybach',
  'Mercedes-Benz',
  'S-Class Maybach',
  NULL,
  5,
  8.00,
  12.00,
  'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/uber%20imgs/sl_255110169_mercedes-benz-s-2020-seitenansicht_4x.png',
  'Ultimate luxury experience with Maybach refinement and prestige',
  'ultra-luxury'
);

-- Create index on car_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_taxi_cars_car_id ON taxi_cars(car_id);

-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS idx_taxi_cars_category ON taxi_cars(category);

-- Create index on seats for passenger capacity filtering
CREATE INDEX IF NOT EXISTS idx_taxi_cars_seats ON taxi_cars(seats);

-- Create index on available status
CREATE INDEX IF NOT EXISTS idx_taxi_cars_available ON taxi_cars(available);

-- Enable Row Level Security (RLS)
ALTER TABLE taxi_cars ENABLE ROW LEVEL SECURITY;

-- Create policy: Anyone can view available taxi cars (read-only)
CREATE POLICY "Anyone can view available taxi cars"
  ON taxi_cars
  FOR SELECT
  USING (available = true);

-- Create policy: Authenticated users can view all taxi cars
CREATE POLICY "Authenticated users can view all taxi cars"
  ON taxi_cars
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy: Only service role can insert/update/delete taxi cars
-- In production, restrict this to specific admin users or use service_role
CREATE POLICY "Service role can modify taxi cars"
  ON taxi_cars
  FOR ALL
  USING (false); -- No regular users can modify, only via service_role or direct admin access

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_taxi_cars_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER taxi_cars_updated_at
  BEFORE UPDATE ON taxi_cars
  FOR EACH ROW
  EXECUTE FUNCTION update_taxi_cars_updated_at();

-- Add comment to table
COMMENT ON TABLE taxi_cars IS 'Taxi car fleet for taxi/concierge service with per-km pricing in CHF';

-- Add comments to important columns
COMMENT ON COLUMN taxi_cars.car_id IS 'Unique identifier for car type (slug format)';
COMMENT ON COLUMN taxi_cars.price_min_chf IS 'Minimum price per kilometer in CHF';
COMMENT ON COLUMN taxi_cars.price_max_chf IS 'Maximum price per kilometer in CHF';
COMMENT ON COLUMN taxi_cars.seats IS 'Maximum passenger capacity';
COMMENT ON COLUMN taxi_cars.category IS 'Car category: luxury-sedan, luxury-van, ultra-luxury';
