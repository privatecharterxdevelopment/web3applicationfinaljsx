-- Partner System Database Migration
-- This adds partner functionality to the existing system

-- 1. Add partner-specific columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS partner_type TEXT CHECK (partner_type IN ('auto', 'taxi', 'adventure', 'limousine', 'other')),
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('iban', 'wallet')),
ADD COLUMN IF NOT EXISTS iban TEXT,
ADD COLUMN IF NOT EXISTS wallet_address TEXT,
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS partner_verified BOOLEAN DEFAULT FALSE;

-- 2. Create partner_details table for KYC/AML data
CREATE TABLE IF NOT EXISTS partner_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- Business Information
  business_registration TEXT NOT NULL,
  tax_id TEXT NOT NULL,

  -- Bank Details (for IBAN payments)
  bank_name TEXT,
  account_holder TEXT,

  -- KYC/AML Information
  id_document_type TEXT CHECK (id_document_type IN ('passport', 'id_card', 'drivers_license')) NOT NULL,
  id_document_number TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  nationality TEXT NOT NULL,

  -- Address Information
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL,

  -- Verification Status
  verification_status TEXT CHECK (verification_status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES users(id),
  rejection_reason TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint
  UNIQUE(user_id)
);

-- 3. Create partner_services table
CREATE TABLE IF NOT EXISTS partner_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- Service Details
  service_type TEXT CHECK (service_type IN ('auto', 'taxi', 'adventure', 'limousine', 'other')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Pricing
  price_amount DECIMAL(10, 2) NOT NULL,
  price_currency TEXT DEFAULT 'EUR',
  price_type TEXT CHECK (price_type IN ('per_hour', 'per_day', 'per_trip', 'fixed')) NOT NULL,

  -- Location
  service_location TEXT NOT NULL, -- e.g., "Dubai Marina"
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),

  -- Availability
  available_from TIME,
  available_to TIME,
  available_days TEXT[], -- ['monday', 'tuesday', etc.]

  -- Media
  images TEXT[], -- Array of image URLs
  features TEXT[], -- Array of features

  -- Status
  status TEXT CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'inactive')) DEFAULT 'draft',
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES users(id),
  rejection_reason TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Indexes
  INDEX idx_partner_services_partner_id (partner_id),
  INDEX idx_partner_services_status (status),
  INDEX idx_partner_services_location (city, country),
  INDEX idx_partner_services_type (service_type)
);

-- 4. Create partner_bookings table
CREATE TABLE IF NOT EXISTS partner_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Relationships
  service_id UUID REFERENCES partner_services(id) ON DELETE SET NULL,
  partner_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- Booking Details
  booking_date DATE NOT NULL,
  booking_time TIME,
  duration_hours INTEGER,

  -- Location
  pickup_location TEXT,
  dropoff_location TEXT,

  -- Pricing
  total_amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'EUR',

  -- Payment
  payment_status TEXT CHECK (payment_status IN ('pending', 'held_escrow', 'released', 'refunded')) DEFAULT 'pending',
  payment_intent_id TEXT, -- Stripe payment intent ID

  -- Status
  status TEXT CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  partner_confirmed_at TIMESTAMP WITH TIME ZONE,
  customer_confirmed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,

  -- Notes
  customer_notes TEXT,
  partner_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Indexes
  INDEX idx_partner_bookings_partner_id (partner_id),
  INDEX idx_partner_bookings_customer_id (customer_id),
  INDEX idx_partner_bookings_status (status),
  INDEX idx_partner_bookings_date (booking_date)
);

-- 5. Create partner_notifications table
CREATE TABLE IF NOT EXISTS partner_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  partner_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES partner_bookings(id) ON DELETE CASCADE,

  -- Notification Details
  type TEXT CHECK (type IN ('new_booking', 'booking_confirmed', 'booking_cancelled', 'payment_received', 'service_approved', 'service_rejected')) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Status
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Indexes
  INDEX idx_partner_notifications_partner_id (partner_id),
  INDEX idx_partner_notifications_read (read)
);

-- 6. Create partner_payouts table
CREATE TABLE IF NOT EXISTS partner_payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  partner_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES partner_bookings(id) ON DELETE SET NULL,

  -- Payout Details
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'EUR',

  -- Payment Method
  payout_method TEXT CHECK (payout_method IN ('iban', 'wallet')) NOT NULL,
  destination_iban TEXT,
  destination_wallet TEXT,

  -- Status
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  stripe_payout_id TEXT,

  -- Completion
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_reason TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Indexes
  INDEX idx_partner_payouts_partner_id (partner_id),
  INDEX idx_partner_payouts_status (status)
);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE partner_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_payouts ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS Policies

-- Partner Details: Partners can view/update their own, admins can view all
CREATE POLICY "Partners can view own details" ON partner_details
  FOR SELECT USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND user_role = 'admin'
  ));

CREATE POLICY "Partners can update own details" ON partner_details
  FOR UPDATE USING (auth.uid() = user_id);

-- Partner Services: Partners manage their own, customers can view approved
CREATE POLICY "Partners can manage own services" ON partner_services
  FOR ALL USING (auth.uid() = partner_id);

CREATE POLICY "Users can view approved services" ON partner_services
  FOR SELECT USING (status = 'approved' OR auth.uid() = partner_id);

-- Partner Bookings: Partners see their bookings, customers see their bookings
CREATE POLICY "Partners can view own bookings" ON partner_bookings
  FOR SELECT USING (auth.uid() = partner_id OR auth.uid() = customer_id);

CREATE POLICY "Customers can create bookings" ON partner_bookings
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Partners can update booking status" ON partner_bookings
  FOR UPDATE USING (auth.uid() = partner_id);

-- Partner Notifications: Partners see their own notifications
CREATE POLICY "Partners can view own notifications" ON partner_notifications
  FOR SELECT USING (auth.uid() = partner_id);

CREATE POLICY "Partners can update own notifications" ON partner_notifications
  FOR UPDATE USING (auth.uid() = partner_id);

-- Partner Payouts: Partners see their own payouts
CREATE POLICY "Partners can view own payouts" ON partner_payouts
  FOR SELECT USING (auth.uid() = partner_id);

-- 9. Create update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_partner_details_updated_at BEFORE UPDATE ON partner_details
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partner_services_updated_at BEFORE UPDATE ON partner_services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partner_bookings_updated_at BEFORE UPDATE ON partner_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partner_payouts_updated_at BEFORE UPDATE ON partner_payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_user_role ON users(user_role);
CREATE INDEX IF NOT EXISTS idx_users_partner_verified ON users(partner_verified) WHERE user_role = 'partner';

-- Done!
COMMENT ON TABLE partner_details IS 'Stores KYC/AML and verification data for partners';
COMMENT ON TABLE partner_services IS 'Services offered by partners (auto, taxi, adventure, limousine)';
COMMENT ON TABLE partner_bookings IS 'Booking requests and confirmations between customers and partners';
COMMENT ON TABLE partner_notifications IS 'Location-based notifications for partners';
COMMENT ON TABLE partner_payouts IS 'Payout tracking for partners via IBAN or crypto wallet';
