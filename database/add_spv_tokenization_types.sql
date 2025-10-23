-- Add SPV Formation and Tokenization request types to user_requests table
-- This allows the forms to save data to the existing user_requests table

-- Drop the existing constraint
ALTER TABLE user_requests DROP CONSTRAINT IF EXISTS valid_type;

-- Add the new constraint with SPV and Tokenization types included
ALTER TABLE user_requests ADD CONSTRAINT valid_type CHECK (
  type = ANY (ARRAY[
    'flight_quote'::text,
    'support'::text,
    'document'::text,
    'visa'::text,
    'payment'::text,
    'booking'::text,
    'cancellation'::text,
    'modification'::text,
    'private_jet_charter'::text,
    'fixed_offer'::text,
    'helicopter_charter'::text,
    'empty_leg'::text,
    'luxury_car_rental'::text,
    'nft_discount_empty_leg'::text,
    'nft_free_flight'::text,
    'spv_formation'::text,
    'tokenization'::text
  ])
);

-- Optional: Add columns for better organization (if they don't exist)
ALTER TABLE user_requests ADD COLUMN IF NOT EXISTS service_type TEXT;
ALTER TABLE user_requests ADD COLUMN IF NOT EXISTS details TEXT;
ALTER TABLE user_requests ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(10, 2);
ALTER TABLE user_requests ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE user_requests ADD COLUMN IF NOT EXISTS client_email TEXT;

-- Create indexes for new columns if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_requests_service_type ON user_requests(service_type);
CREATE INDEX IF NOT EXISTS idx_user_requests_estimated_cost ON user_requests(estimated_cost);

-- Success message
COMMENT ON CONSTRAINT valid_type ON user_requests IS 'Updated to include spv_formation and tokenization types';
