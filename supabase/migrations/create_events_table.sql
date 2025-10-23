-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic event information
  event_name VARCHAR(500) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  subcategory VARCHAR(100),

  -- Date and time
  event_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  timezone VARCHAR(100) DEFAULT 'UTC',

  -- Location
  venue_name VARCHAR(300),
  address VARCHAR(500),
  city VARCHAR(150),
  state VARCHAR(100),
  country VARCHAR(100),
  postal_code VARCHAR(20),
  is_online_event BOOLEAN DEFAULT FALSE,

  -- Pricing
  price_min DECIMAL(10, 2),
  price_max DECIMAL(10, 2),
  currency VARCHAR(10) DEFAULT 'USD',
  is_free BOOLEAN DEFAULT FALSE,

  -- Status and availability
  status VARCHAR(50) DEFAULT 'active', -- active, sold_out, cancelled, postponed
  tickets_available INTEGER,
  total_capacity INTEGER,

  -- External links
  event_url VARCHAR(1000),
  ticket_url VARCHAR(1000),
  image_url VARCHAR(1000),

  -- Metadata
  platform VARCHAR(50), -- ticketmaster, eventbrite, custom, etc.
  external_id VARCHAR(200), -- ID from external platform
  featured BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes
  CONSTRAINT unique_external_event UNIQUE (platform, external_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_city ON public.events(city);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_featured ON public.events(featured);
CREATE INDEX IF NOT EXISTS idx_events_platform ON public.events(platform);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_updated_at_trigger
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow all users to read events
CREATE POLICY "Events are viewable by everyone" ON public.events
  FOR SELECT USING (true);

-- Only admins can insert events
CREATE POLICY "Only admins can insert events" ON public.events
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- Only admins can update events
CREATE POLICY "Only admins can update events" ON public.events
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- Only admins can delete events
CREATE POLICY "Only admins can delete events" ON public.events
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- Insert some sample events for testing
INSERT INTO public.events (
  event_name,
  description,
  category,
  event_date,
  venue_name,
  city,
  state,
  country,
  price_min,
  price_max,
  currency,
  status,
  event_url,
  image_url,
  platform,
  featured
) VALUES
(
  'Miami Art Basel 2025',
  'The world's premier Modern and Contemporary art fair.',
  'Arts & Culture',
  '2025-12-04 10:00:00-05:00',
  'Miami Beach Convention Center',
  'Miami Beach',
  'FL',
  'USA',
  75.00,
  500.00,
  'USD',
  'active',
  'https://www.artbasel.com/miami-beach',
  'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=800',
  'custom',
  true
),
(
  'Ultra Music Festival 2025',
  'World''s premier electronic music festival.',
  'Music',
  '2025-03-28 12:00:00-04:00',
  'Bayfront Park',
  'Miami',
  'FL',
  'USA',
  399.00,
  1499.00,
  'USD',
  'active',
  'https://ultramusicfestival.com',
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
  'custom',
  true
),
(
  'Miami Grand Prix',
  'Formula 1 racing at its finest in Miami.',
  'Sports',
  '2025-05-02 13:00:00-04:00',
  'Miami International Autodrome',
  'Miami Gardens',
  'FL',
  'USA',
  350.00,
  5000.00,
  'USD',
  'active',
  'https://www.f1miamigp.com',
  'https://images.unsplash.com/photo-1563298723-dcfebaa392e3?w=800',
  'custom',
  true
),
(
  'South Beach Wine & Food Festival',
  'Culinary celebration with celebrity chefs.',
  'Food & Drink',
  '2025-02-20 18:00:00-05:00',
  'Various Locations',
  'Miami Beach',
  'FL',
  'USA',
  125.00,
  750.00,
  'USD',
  'active',
  'https://sobewff.org',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
  'custom',
  false
),
(
  'Miami International Boat Show',
  'The biggest boat show in the world.',
  'Lifestyle',
  '2025-02-12 10:00:00-05:00',
  'Miami Beach Convention Center',
  'Miami Beach',
  'FL',
  'USA',
  30.00,
  50.00,
  'USD',
  'active',
  'https://www.miamiboatshow.com',
  'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800',
  'custom',
  false
);

COMMENT ON TABLE public.events IS 'Stores events for display on the platform';
