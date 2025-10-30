-- Partner System Updates Migration
-- Adds admin payment approval and partner adventure visibility controls

-- ============================================================
-- 1. Update partner_services table
-- ============================================================

-- Add is_public column (adventure packages are private by default)
ALTER TABLE partner_services
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Update service type constraint (only 4 types allowed)
ALTER TABLE partner_services
DROP CONSTRAINT IF EXISTS partner_services_service_type_check;

ALTER TABLE partner_services
ADD CONSTRAINT partner_services_service_type_check
CHECK (service_type IN ('car_rental', 'limousine', 'concierge', 'adventure'));

-- Create trigger to automatically set adventure packages as private
CREATE OR REPLACE FUNCTION set_adventure_visibility()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.service_type = 'adventure' THEN
    NEW.is_public = false;
  ELSE
    NEW.is_public = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS adventure_visibility_trigger ON partner_services;
CREATE TRIGGER adventure_visibility_trigger
BEFORE INSERT OR UPDATE ON partner_services
FOR EACH ROW
EXECUTE FUNCTION set_adventure_visibility();

-- Add index for public services
CREATE INDEX IF NOT EXISTS idx_partner_services_is_public ON partner_services(is_public);

-- ============================================================
-- 2. Update partner_bookings table
-- ============================================================

-- Add payment approval status column
ALTER TABLE partner_bookings
ADD COLUMN IF NOT EXISTS payment_approval_status TEXT DEFAULT 'pending'
CHECK (payment_approval_status IN ('pending', 'awaiting_approval', 'approved', 'rejected'));

-- Add admin approval tracking
ALTER TABLE partner_bookings
ADD COLUMN IF NOT EXISTS payment_approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS payment_approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_rejection_reason TEXT;

-- Add commission tracking
ALTER TABLE partner_bookings
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(4, 3) DEFAULT 0.10,
ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS partner_earnings DECIMAL(10, 2);

-- Update payment_status constraint to include new statuses
ALTER TABLE partner_bookings
DROP CONSTRAINT IF EXISTS partner_bookings_payment_status_check;

ALTER TABLE partner_bookings
ADD CONSTRAINT partner_bookings_payment_status_check
CHECK (payment_status IN ('pending', 'held_escrow', 'captured_transferred', 'released', 'refunded'));

-- Add indexes for payment approval
CREATE INDEX IF NOT EXISTS idx_partner_bookings_payment_approval ON partner_bookings(payment_approval_status);

-- ============================================================
-- 3. Update fixed_offers table (for partner adventures)
-- ============================================================

-- Add partner tracking columns
ALTER TABLE fixed_offers
ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_partner_offer BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS partner_logo_url TEXT,
ADD COLUMN IF NOT EXISTS partner_company_name TEXT;

-- Add admin approval tracking for pushed partner adventures
ALTER TABLE fixed_offers
ADD COLUMN IF NOT EXISTS pushed_from_service_id UUID REFERENCES partner_services(id),
ADD COLUMN IF NOT EXISTS pushed_by_admin UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS pushed_at TIMESTAMP WITH TIME ZONE;

-- Add index for partner offers
CREATE INDEX IF NOT EXISTS idx_fixed_offers_is_partner_offer ON fixed_offers(is_partner_offer);
CREATE INDEX IF NOT EXISTS idx_fixed_offers_partner_id ON fixed_offers(partner_id);

-- ============================================================
-- 4. Create partner_earnings table (if not exists)
-- ============================================================

CREATE TABLE IF NOT EXISTS partner_earnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Relationships
  partner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES partner_bookings(id) ON DELETE SET NULL,

  -- Earnings Details
  gross_amount DECIMAL(10, 2) NOT NULL, -- Total booking amount
  commission_rate DECIMAL(4, 3) NOT NULL, -- e.g., 0.10 for 10%
  commission_amount DECIMAL(10, 2) NOT NULL, -- Platform commission
  net_earnings DECIMAL(10, 2) NOT NULL, -- Partner receives
  currency TEXT DEFAULT 'EUR',

  -- Service Info
  service_type TEXT, -- taxi, limousine, adventure, etc.
  service_title TEXT,

  -- Payment Tracking
  stripe_transfer_id TEXT, -- Stripe transfer ID
  stripe_payout_id TEXT, -- Stripe payout ID
  transfer_date TIMESTAMP WITH TIME ZONE,
  payout_date TIMESTAMP WITH TIME ZONE,

  -- Status
  status TEXT CHECK (status IN ('pending', 'paid', 'failed')) DEFAULT 'pending',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for partner_earnings
CREATE INDEX IF NOT EXISTS idx_partner_earnings_partner_id ON partner_earnings(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_earnings_booking_id ON partner_earnings(booking_id);
CREATE INDEX IF NOT EXISTS idx_partner_earnings_status ON partner_earnings(status);
CREATE INDEX IF NOT EXISTS idx_partner_earnings_created_at ON partner_earnings(created_at);

-- Enable RLS on partner_earnings
ALTER TABLE partner_earnings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Partners can view their own earnings
DROP POLICY IF EXISTS "Partners can view own earnings" ON partner_earnings;
CREATE POLICY "Partners can view own earnings" ON partner_earnings
  FOR SELECT USING (auth.uid() = partner_id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND user_role = 'admin'
  ));

-- ============================================================
-- 5. Create commission calculation function
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_partner_commission(
  p_service_type TEXT,
  p_amount DECIMAL
)
RETURNS TABLE (
  rate DECIMAL,
  commission DECIMAL,
  earnings DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN p_service_type IN ('taxi', 'car_rental') THEN 0.10::DECIMAL
      WHEN p_service_type IN ('limousine', 'luxury-car') THEN 0.12::DECIMAL
      WHEN p_service_type IN ('adventure', 'concierge') THEN 0.15::DECIMAL
      ELSE 0.10::DECIMAL
    END AS rate,
    CASE
      WHEN p_service_type IN ('taxi', 'car_rental') THEN (p_amount * 0.10)::DECIMAL
      WHEN p_service_type IN ('limousine', 'luxury-car') THEN (p_amount * 0.12)::DECIMAL
      WHEN p_service_type IN ('adventure', 'concierge') THEN (p_amount * 0.15)::DECIMAL
      ELSE (p_amount * 0.10)::DECIMAL
    END AS commission,
    CASE
      WHEN p_service_type IN ('taxi', 'car_rental') THEN (p_amount * 0.90)::DECIMAL
      WHEN p_service_type IN ('limousine', 'luxury-car') THEN (p_amount * 0.88)::DECIMAL
      WHEN p_service_type IN ('adventure', 'concierge') THEN (p_amount * 0.85)::DECIMAL
      ELSE (p_amount * 0.90)::DECIMAL
    END AS earnings;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 6. Update RLS policies for partner services visibility
-- ============================================================

-- Drop old policy
DROP POLICY IF EXISTS "Users can view approved services" ON partner_services;

-- New policy: Users can view approved AND public services
CREATE POLICY "Users can view approved public services" ON partner_services
  FOR SELECT USING (
    (status = 'approved' AND is_public = true) OR
    auth.uid() = partner_id OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_role = 'admin')
  );

-- ============================================================
-- 7. Update partner_bookings RLS for admin access
-- ============================================================

-- Drop old policies
DROP POLICY IF EXISTS "Partners can view own bookings" ON partner_bookings;

-- New policy: Partners, customers, and admins can view bookings
CREATE POLICY "Partners and admins can view bookings" ON partner_bookings
  FOR SELECT USING (
    auth.uid() = partner_id OR
    auth.uid() = customer_id OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_role = 'admin')
  );

-- Admins can update booking payment approval
DROP POLICY IF EXISTS "Admins can approve payments" ON partner_bookings;
CREATE POLICY "Admins can approve payments" ON partner_bookings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_role = 'admin')
  );

-- ============================================================
-- 8. Add comments for documentation
-- ============================================================

COMMENT ON COLUMN partner_services.is_public IS 'Adventure packages are private by default (only visible to partner and admin)';
COMMENT ON COLUMN partner_bookings.payment_approval_status IS 'Admin must approve payment before capture: pending → awaiting_approval → approved/rejected';
COMMENT ON COLUMN partner_bookings.commission_rate IS 'Platform commission rate (0.10 = 10%, 0.12 = 12%, 0.15 = 15%)';
COMMENT ON COLUMN fixed_offers.is_partner_offer IS 'True if this adventure was created by a partner and pushed to public by admin';
COMMENT ON COLUMN fixed_offers.pushed_from_service_id IS 'Reference to original partner_services.id if this was pushed from a partner adventure';

COMMENT ON TABLE partner_earnings IS 'Tracks partner earnings with commission breakdown per booking';
COMMENT ON FUNCTION calculate_partner_commission IS 'Calculates commission based on service type: Taxi/Car 10%, Limousine 12%, Adventure/Concierge 15%';

-- ============================================================
-- Migration Complete!
-- ============================================================
