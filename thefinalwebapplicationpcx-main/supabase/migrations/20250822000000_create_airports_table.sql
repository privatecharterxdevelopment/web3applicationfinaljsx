CREATE TABLE airports (
  id SERIAL PRIMARY KEY,
  code VARCHAR(3) NOT NULL UNIQUE,
  lat DECIMAL(10, 6),
  lon DECIMAL(10, 6),
  name VARCHAR(255),
  city VARCHAR(255),
  state VARCHAR(255),
  country VARCHAR(255),
  woeid VARCHAR(50),
  tz VARCHAR(100),
  phone VARCHAR(50),
  type VARCHAR(50),
  email VARCHAR(255),
  url VARCHAR(255),
  runway_length INTEGER,
  elev INTEGER,
  icao VARCHAR(4),
  direct_flights INTEGER,
  carriers INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better search performance
CREATE INDEX idx_airports_code ON airports(code);
CREATE INDEX idx_airports_name ON airports(name);
CREATE INDEX idx_airports_city ON airports(city);
CREATE INDEX idx_airports_country ON airports(country);

-- Create a compound index for location-based searches
CREATE INDEX idx_airports_location ON airports(lat, lon);

-- Add RLS policy to allow public read access
ALTER TABLE airports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to airports"
ON airports FOR SELECT
TO public
USING (true);