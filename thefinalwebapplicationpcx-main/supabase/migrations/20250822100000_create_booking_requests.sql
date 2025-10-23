-- Create streamlined booking requests table
CREATE TABLE booking_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Flight Route (just codes - details fetched from airports.json)
  origin_airport_code VARCHAR(4) NOT NULL,
  destination_airport_code VARCHAR(4) NOT NULL,
  
  -- Flight Details
  departure_date DATE NOT NULL,
  departure_time TIME NOT NULL,
  passengers INTEGER NOT NULL DEFAULT 1,
  luggage INTEGER NOT NULL DEFAULT 1,
  pets INTEGER NOT NULL DEFAULT 0,
  
  -- Aircraft Selection
  selected_jet_category VARCHAR(50) NOT NULL,
  
  -- Services Selection
  aviation_services JSONB DEFAULT '[]'::jsonb, -- Array of selected aviation service IDs
  luxury_services JSONB DEFAULT '[]'::jsonb,   -- Array of selected luxury service IDs
  
  -- Carbon Offset
  carbon_option VARCHAR(20) NOT NULL DEFAULT 'none', -- 'none' or 'full'
  carbon_nft_wallet VARCHAR(42), -- Ethereum wallet address for NFT
  
  -- Pricing
  total_price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  payment_method VARCHAR(20) NOT NULL, -- 'bank', 'card', 'crypto'
  
  -- Contact Information
  contact_name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50) NOT NULL,
  contact_company VARCHAR(255),
  
  -- Web3 Integration
  wallet_address VARCHAR(42), -- Connected wallet address
  nft_discount_applied BOOLEAN DEFAULT FALSE,
  
  -- Request Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'completed'
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign Key (if user authentication is implemented)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX idx_booking_requests_status ON booking_requests(status);
CREATE INDEX idx_booking_requests_created_at ON booking_requests(created_at);
CREATE INDEX idx_booking_requests_contact_email ON booking_requests(contact_email);
CREATE INDEX idx_booking_requests_departure_date ON booking_requests(departure_date);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_booking_requests_updated_at
  BEFORE UPDATE ON booking_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only view their own booking requests (read-only)
CREATE POLICY "Users can view own booking requests" ON booking_requests
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Users can insert booking requests
CREATE POLICY "Users can insert booking requests" ON booking_requests
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Only admins can update booking requests
CREATE POLICY "Only admins can update booking requests" ON booking_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.uid() = id 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Admins can view all requests
-- CREATE POLICY "Admins can view all booking requests" ON booking_requests
--   FOR ALL USING (
--     EXISTS (
--       SELECT 1 FROM auth.users 
--       WHERE auth.uid() = id 
--       AND raw_user_meta_data->>'role' = 'admin'
--     )
--   );

-- Create a view for admin dashboard
CREATE VIEW booking_requests_summary AS
SELECT 
  id,
  origin_airport_code,
  destination_airport_code,
  departure_date,
  departure_time,
  passengers,
  selected_jet_category,
  total_price,
  currency,
  contact_name,
  contact_email,
  contact_phone,
  status,
  created_at
FROM booking_requests
ORDER BY created_at DESC;

-- Grant permissions
GRANT SELECT, INSERT ON booking_requests TO authenticated;
GRANT SELECT ON booking_requests_summary TO authenticated;