-- Add postal_code to partner_services for ZIP-based matching
-- This allows filtering partner services by customer location (ZIP code)

ALTER TABLE partner_services
ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- Create index for postal_code filtering
CREATE INDEX IF NOT EXISTS idx_partner_services_postal_code ON partner_services(postal_code);

-- Create combined index for location-based queries (city + postal_code)
CREATE INDEX IF NOT EXISTS idx_partner_services_location_full ON partner_services(city, postal_code, country);

COMMENT ON COLUMN partner_services.postal_code IS 'Postal/ZIP code for location-based service matching';
