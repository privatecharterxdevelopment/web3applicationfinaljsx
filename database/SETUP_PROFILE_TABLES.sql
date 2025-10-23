-- =====================================================
-- PROFILE OVERVIEW - REQUIRED TABLES SETUP
-- Run this to ensure all tables needed for Profile Overview exist
-- =====================================================

-- 1. Ensure user_profiles table exists
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    bio TEXT,
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    kyc_status VARCHAR(50) DEFAULT 'not_started' CHECK (kyc_status IN ('not_started', 'pending', 'verified', 'rejected')),
    wallet_address VARCHAR(42),
    wallet_type VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. Ensure tokenization_drafts table exists (from supabase-tokenization-migration.sql)
CREATE TABLE IF NOT EXISTS public.tokenization_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token_type TEXT CHECK (token_type IN ('utility', 'security')),
    current_step INTEGER DEFAULT 1,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'cancelled')),
    asset_name TEXT,
    asset_category TEXT,
    asset_description TEXT,
    asset_value DECIMAL(18, 2),
    asset_location TEXT,
    logo_url TEXT,
    header_image_url TEXT,
    token_standard TEXT,
    total_supply BIGINT,
    token_symbol TEXT,
    price_per_token DECIMAL(18, 6),
    minimum_investment DECIMAL(18, 2),
    expected_apy DECIMAL(5, 2),
    revenue_distribution TEXT CHECK (revenue_distribution IN ('monthly', 'quarterly', 'annually')),
    revenue_currency TEXT CHECK (revenue_currency IN ('USDC', 'USDT')),
    lockup_period INTEGER,
    has_spv BOOLEAN DEFAULT false,
    spv_details TEXT,
    operator TEXT CHECK (operator IN ('owner', 'third-party', 'pcx-partners')),
    management_fee DECIMAL(5, 2),
    access_rights TEXT,
    validity_period TEXT,
    is_transferable BOOLEAN DEFAULT true,
    is_burnable BOOLEAN DEFAULT false,
    jurisdiction TEXT,
    needs_audit BOOLEAN DEFAULT false,
    form_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    CONSTRAINT valid_step CHECK (current_step BETWEEN 1 AND 6)
);

-- 3. Ensure booking_requests table exists
CREATE TABLE IF NOT EXISTS public.booking_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    request_type VARCHAR(50),
    origin VARCHAR(255),
    destination VARCHAR(255),
    departure_date TIMESTAMPTZ,
    return_date TIMESTAMPTZ,
    passengers INTEGER,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    estimated_price DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create SPV Formations table (simplified version for profile display)
CREATE TABLE IF NOT EXISTS public.spv_formations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    user_address VARCHAR(255), -- For backward compatibility with wallet-based auth
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('premium', 'standard', 'budget', 'usa')),
    jurisdiction VARCHAR(100) NOT NULL,
    jurisdiction_formation_fee DECIMAL(10, 2) NOT NULL,
    jurisdiction_annual_fee DECIMAL(10, 2) NOT NULL,
    jurisdiction_tax_rate VARCHAR(50),
    jurisdiction_duration VARCHAR(50),
    jurisdiction_description TEXT,
    company_name VARCHAR(255) NOT NULL,
    business_activity VARCHAR(255) NOT NULL,
    company_description TEXT NOT NULL,
    number_of_directors INTEGER NOT NULL DEFAULT 1,
    number_of_shareholders INTEGER NOT NULL DEFAULT 1,
    estimated_annual_revenue DECIMAL(15, 2),
    total_formation_cost DECIMAL(10, 2) NOT NULL,
    total_annual_cost DECIMAL(10, 2) NOT NULL,
    total_first_year_cost DECIMAL(10, 2) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'documents_pending', 'approved', 'in_formation', 'completed', 'rejected')),
    submission_date TIMESTAMPTZ DEFAULT NOW(),
    completion_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_tokenization_drafts_user_id ON public.tokenization_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_tokenization_drafts_status ON public.tokenization_drafts(status);
CREATE INDEX IF NOT EXISTS idx_booking_requests_user_id ON public.booking_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_status ON public.booking_requests(status);
CREATE INDEX IF NOT EXISTS idx_spv_formations_user_id ON public.spv_formations(user_id);
CREATE INDEX IF NOT EXISTS idx_spv_formations_user_address ON public.spv_formations(user_address);
CREATE INDEX IF NOT EXISTS idx_spv_formations_status ON public.spv_formations(status);
CREATE INDEX IF NOT EXISTS idx_spv_formations_contact_email ON public.spv_formations(contact_email);

-- 6. Enable RLS (Row Level Security)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokenization_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spv_formations ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS Policies for user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile"
ON public.user_profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile"
ON public.user_profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
CREATE POLICY "Users can insert their own profile"
ON public.user_profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 8. Create RLS Policies for tokenization_drafts
DROP POLICY IF EXISTS "Users can view their own tokenization drafts" ON public.tokenization_drafts;
CREATE POLICY "Users can view their own tokenization drafts"
ON public.tokenization_drafts FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own tokenization drafts" ON public.tokenization_drafts;
CREATE POLICY "Users can create their own tokenization drafts"
ON public.tokenization_drafts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own tokenization drafts" ON public.tokenization_drafts;
CREATE POLICY "Users can update their own tokenization drafts"
ON public.tokenization_drafts FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- 9. Create RLS Policies for booking_requests
DROP POLICY IF EXISTS "Users can view their own booking requests" ON public.booking_requests;
CREATE POLICY "Users can view their own booking requests"
ON public.booking_requests FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own booking requests" ON public.booking_requests;
CREATE POLICY "Users can create their own booking requests"
ON public.booking_requests FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own booking requests" ON public.booking_requests;
CREATE POLICY "Users can update their own booking requests"
ON public.booking_requests FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- 10. Create RLS Policies for spv_formations
DROP POLICY IF EXISTS "Users can view their own spv formations" ON public.spv_formations;
CREATE POLICY "Users can view their own spv formations"
ON public.spv_formations FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR contact_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can create their own spv formations" ON public.spv_formations;
CREATE POLICY "Users can create their own spv formations"
ON public.spv_formations FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own spv formations" ON public.spv_formations;
CREATE POLICY "Users can update their own spv formations"
ON public.spv_formations FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- 11. Create trigger functions for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Create triggers
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tokenization_drafts_updated_at ON public.tokenization_drafts;
CREATE TRIGGER update_tokenization_drafts_updated_at
    BEFORE UPDATE ON public.tokenization_drafts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_booking_requests_updated_at ON public.booking_requests;
CREATE TRIGGER update_booking_requests_updated_at
    BEFORE UPDATE ON public.booking_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_spv_formations_updated_at ON public.spv_formations;
CREATE TRIGGER update_spv_formations_updated_at
    BEFORE UPDATE ON public.spv_formations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Summary:
-- ✅ user_profiles table created
-- ✅ tokenization_drafts table created
-- ✅ booking_requests table created
-- ✅ spv_formations table created
-- ✅ Indexes created for all tables
-- ✅ RLS policies enabled
-- ✅ Triggers for updated_at fields created
--
-- Next Steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Profile Overview page will now work properly
-- 3. All data will be fetched from real tables
