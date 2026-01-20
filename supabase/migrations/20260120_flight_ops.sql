-- Flight Ops Routes (SEPARATE table from fixed_offers)
CREATE TABLE IF NOT EXISTS flight_ops_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  image_url TEXT,
  aircraft_type TEXT,
  passengers INTEGER DEFAULT 6,
  duration TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Flight Bids
CREATE TABLE IF NOT EXISTS flight_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES flight_ops_routes(id) ON DELETE CASCADE,
  bid_amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending',
  admin_response TEXT,
  counter_amount NUMERIC(12, 2),
  passengers INTEGER NOT NULL DEFAULT 1,
  departure_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE flight_ops_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE flight_bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view routes" ON flight_ops_routes FOR SELECT USING (true);
CREATE POLICY "Users can view own bids" ON flight_bids FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create bids" ON flight_bids FOR INSERT WITH CHECK (auth.uid() = user_id);

GRANT SELECT ON flight_ops_routes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON flight_bids TO authenticated;
