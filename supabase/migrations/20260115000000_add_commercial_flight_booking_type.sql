-- Migration: Add commercial_flight to user_bookings booking_type
-- This allows storing commercial flight bookings from Duffel API

-- Drop the existing constraint and recreate with commercial_flight included
ALTER TABLE user_bookings
DROP CONSTRAINT IF EXISTS user_bookings_booking_type_check;

ALTER TABLE user_bookings
ADD CONSTRAINT user_bookings_booking_type_check
CHECK (booking_type IN ('empty_leg', 'adventure_package', 'co2_certificate', 'commercial_flight', 'flight'));

-- Add comment for documentation
COMMENT ON COLUMN user_bookings.booking_type IS 'Type of booking: empty_leg, adventure_package, co2_certificate, commercial_flight, flight';
