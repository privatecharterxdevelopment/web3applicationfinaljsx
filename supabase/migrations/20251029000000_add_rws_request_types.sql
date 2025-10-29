-- Migration: Add RWS service types to user_requests table
-- This allows all Real World Services (Jets, Helis, Empty Legs, Adventures, etc.) to be saved

-- Remove the old restrictive constraint
ALTER TABLE user_requests DROP CONSTRAINT IF EXISTS valid_type;

-- Add new constraint with ALL RWS service types
ALTER TABLE user_requests ADD CONSTRAINT valid_type CHECK (type IN (
  -- Original types
  'flight_quote',
  'support',
  'document',
  'visa',
  'payment',
  'booking',
  'cancellation',
  'modification',
  -- RWS service types
  'taxi_concierge',
  'private_jet_charter',
  'helicopter_charter',
  'empty_leg',
  'adventure_package',
  'luxury_car_rental',
  'fixed_offer',
  'event_booking',
  'spv_formation',
  'tokenization',
  'co2_certificate'
));

-- Add index for better performance on type queries
CREATE INDEX IF NOT EXISTS idx_user_requests_type ON user_requests(type);

-- Add comment for documentation
COMMENT ON CONSTRAINT valid_type ON user_requests IS 'Allowed request types including all RWS services';
