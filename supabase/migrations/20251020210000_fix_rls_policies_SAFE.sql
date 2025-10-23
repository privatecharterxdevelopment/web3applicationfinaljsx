-- MINIMAL SAFE FIX - Only fixes actual console errors, doesn't touch working tables
-- Created: 2025-01-20 after user feedback

-- =============================================
-- ONLY FIX TABLES THAT ARE ACTUALLY BROKEN
-- =============================================

-- DO NOT TOUCH:
-- - users (working)
-- - user_profiles (working)
-- - user_pvcx_balances (working)
-- - blog_posts (working)
-- - jets (working)
-- - EmptyLegs_ (WORKING - correct table name!)
-- - fixed_offers (working)
-- - helicopter_charters (working)

-- ONLY CREATE MISSING TABLES THAT CAUSE 404:
-- - co2_certificates (doesn't exist, code queries it)

-- =============================================
-- 1. CREATE CO2_CERTIFICATES TABLE (404 error)
-- =============================================

CREATE TABLE IF NOT EXISTS co2_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  co2_offset_tons DECIMAL(10, 2),
  certificate_type TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE co2_certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view co2 certificates" ON co2_certificates;

CREATE POLICY "Anyone can view co2 certificates"
  ON co2_certificates
  FOR SELECT
  TO public
  USING (true);

-- =============================================
-- SUMMARY
-- =============================================
-- This MINIMAL migration ONLY:
-- ✅ Creates co2_certificates table (was causing 404 errors)
-- ✅ Adds RLS policy for public read
--
-- IT DOES NOT TOUCH:
-- ❌ users, user_profiles, user_pvcx_balances
-- ❌ blog_posts
-- ❌ jets
-- ❌ EmptyLegs_ (correct table, working perfectly!)
-- ❌ fixed_offers
-- ❌ helicopter_charters
--
-- WHY: App is working perfectly, don't break what works!
