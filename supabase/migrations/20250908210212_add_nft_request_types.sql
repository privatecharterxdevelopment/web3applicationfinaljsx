-- Add NFT-related request types to user_requests table constraint
-- This allows for nft_discount_empty_leg and nft_free_flight request types

-- Drop the existing constraint
ALTER TABLE user_requests DROP CONSTRAINT valid_type;

-- Add the new constraint with NFT request types included
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
    'nft_free_flight'::text
  ])
);