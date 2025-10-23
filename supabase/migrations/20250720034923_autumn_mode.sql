/*
  # Update user_requests table to support all service types

  1. Changes
    - Update the valid_type constraint to include all service request types
    - Add support for: private_jet_charter, fixed_offer, helicopter_charter, empty_leg, luxury_car_rental

  2. Security
    - Maintains existing RLS policies
    - No changes to permissions structure
*/

-- Update the constraint to include all service types
ALTER TABLE user_requests DROP CONSTRAINT IF EXISTS valid_type;

ALTER TABLE user_requests ADD CONSTRAINT valid_type 
CHECK (type = ANY (ARRAY[
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
  'luxury_car_rental'::text
]));