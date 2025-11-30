-- Migration: Add AI Chat and additional request types to user_requests table
-- This allows ai_chat_bulk and other AI-generated request types to be saved
-- These types use the SAME user_id column as all other requests - no conflicts

-- Drop the existing constraint
ALTER TABLE user_requests DROP CONSTRAINT IF EXISTS valid_type;

-- Add new constraint with ALL request types including AI Chat types
-- NOTE: This uses the same user_requests table structure - ai_chat_bulk requests
-- are linked to users via the standard user_id column, same as all other request types
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
  'co2_certificate',
  -- NFT request types
  'nft_discount_empty_leg',
  'nft_free_flight',
  -- AI Chat types (use same user_id column for user association)
  'ai_chat_bulk',           -- Bulk requests from AI concierge (multiple items)
  'custom_request',         -- Custom AI chat single requests
  'cart_checkout',          -- Cart checkout with multiple items
  'restaurant_reservation', -- Restaurant bookings via AI
  'yacht_charter',          -- Yacht bookings
  'ground_transport',       -- Ground transport/taxi via AI
  'consultation'            -- Consultation requests
));

-- Add comment for documentation
COMMENT ON CONSTRAINT valid_type ON user_requests IS 'Allowed request types including RWS services, NFT benefits, and AI Chat bulk requests';
