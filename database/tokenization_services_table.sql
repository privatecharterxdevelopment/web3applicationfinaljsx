-- =====================================================
-- TOKENIZATION CONSULTING SERVICES TABLE
-- For AI Chat bookable services
-- =====================================================

CREATE TABLE IF NOT EXISTS public.tokenization_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Service Info
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    service_type TEXT CHECK (service_type IN ('consulting', 'full-service', 'legal-setup', 'technical-setup', 'marketing')) DEFAULT 'consulting',
    
    -- Pricing
    price_eur DECIMAL(18, 2),
    price_usd DECIMAL(18, 2),
    currency TEXT DEFAULT 'EUR',
    duration_hours INTEGER, -- Estimated consultation duration
    
    -- Token Types Supported
    supports_utility_tokens BOOLEAN DEFAULT true,
    supports_security_tokens BOOLEAN DEFAULT true,
    supports_nft BOOLEAN DEFAULT true,
    
    -- What's Included
    includes JSONB, -- Array of services included
    deliverables JSONB, -- Array of deliverables
    
    -- Compliance & Jurisdictions
    jurisdictions JSONB, -- Array of supported jurisdictions ["Malta", "Isle of Man", etc.]
    compliance_included BOOLEAN DEFAULT false,
    legal_review_included BOOLEAN DEFAULT false,
    
    -- Booking Configuration
    is_bookable BOOLEAN DEFAULT true,
    requires_consultation BOOLEAN DEFAULT true,
    consultation_duration_mins INTEGER DEFAULT 30,
    
    -- Media
    images JSONB,
    icon_url TEXT,
    
    -- SEO & Display
    featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'coming_soon')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tokenization_services_status ON public.tokenization_services(status);
CREATE INDEX IF NOT EXISTS idx_tokenization_services_featured ON public.tokenization_services(featured);
CREATE INDEX IF NOT EXISTS idx_tokenization_services_service_type ON public.tokenization_services(service_type);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_tokenization_services_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tokenization_services_timestamp
    BEFORE UPDATE ON public.tokenization_services
    FOR EACH ROW
    EXECUTE FUNCTION update_tokenization_services_timestamp();

-- Insert sample tokenization consulting services
INSERT INTO public.tokenization_services (
    name,
    title,
    description,
    service_type,
    price_eur,
    price_usd,
    duration_hours,
    supports_utility_tokens,
    supports_security_tokens,
    supports_nft,
    includes,
    deliverables,
    jurisdictions,
    compliance_included,
    legal_review_included,
    is_bookable,
    requires_consultation,
    featured,
    sort_order,
    status
) VALUES
(
    'Tokenization Consulting - Initial',
    'Tokenization Strategy Consultation',
    'Expert consultation to determine the best tokenization approach for your asset. We analyze your asset type, jurisdiction requirements, and business goals to create a comprehensive tokenization strategy.',
    'consulting',
    5000.00,
    5500.00,
    8,
    true,
    true,
    true,
    '["Initial assessment call", "Asset evaluation", "Jurisdiction analysis", "Token type recommendation", "Compliance roadmap", "Cost estimation", "Timeline planning", "Q&A session"]',
    '["Tokenization strategy document", "Jurisdiction recommendation report", "Compliance checklist", "Cost breakdown", "Implementation timeline"]',
    '["Malta", "Isle of Man", "Cayman Islands", "British Virgin Islands", "Switzerland", "Liechtenstein", "United Kingdom", "Luxembourg"]',
    true,
    false,
    true,
    true,
    true,
    1,
    'active'
),
(
    'Tokenization Full-Service - Utility',
    'Full-Service Utility Token Setup',
    'Complete end-to-end utility token creation service. From legal structure to smart contract deployment, we handle everything. Perfect for loyalty programs, access tokens, and service vouchers.',
    'full-service',
    25000.00,
    27500.00,
    80,
    true,
    false,
    false,
    '["Legal entity setup", "Token legal opinion", "Smart contract development", "Security audit", "Whitepaper creation", "Token economics design", "Wallet integration", "Exchange listing support", "Marketing materials", "Launch support"]',
    '["SPV entity (Malta/Isle of Man)", "Legal compliance documents", "Audited smart contract", "Professional whitepaper", "Token dashboard", "Marketing kit", "Launch strategy"]',
    '["Malta", "Isle of Man", "Cayman Islands"]',
    true,
    true,
    true,
    true,
    true,
    2,
    'active'
),
(
    'Tokenization Full-Service - Security',
    'Full-Service Security Token Offering (STO)',
    'Enterprise-grade security token offering for real asset tokenization. Includes full legal compliance, prospectus preparation, and regulatory filing. For jets, yachts, real estate, and high-value assets.',
    'full-service',
    75000.00,
    82500.00,
    200,
    false,
    true,
    false,
    '["SPV legal entity setup", "Prospectus preparation", "Regulatory filing", "KYC/AML compliance setup", "Smart contract development", "Security audit (2 firms)", "Cap table management", "Investor portal", "Secondary market integration", "Legal opinions (multiple jurisdictions)", "Ongoing compliance support (12 months)"]',
    '["Fully compliant SPV entity", "Approved prospectus", "Regulatory approvals", "Audited smart contract", "Investor management platform", "Cap table system", "Legal opinion letters", "Compliance monitoring (1 year)"]',
    '["Malta", "Liechtenstein", "Switzerland", "Luxembourg", "Gibraltar"]',
    true,
    true,
    true,
    true,
    true,
    3,
    'active'
),
(
    'Legal Setup Only',
    'Legal Entity & Compliance Setup',
    'Establish the legal foundation for your tokenization project. We set up the optimal legal structure (SPV, Foundation, LLC) in your chosen jurisdiction with full compliance documentation.',
    'legal-setup',
    15000.00,
    16500.00,
    40,
    true,
    true,
    true,
    '["Jurisdiction selection", "Entity formation", "Operating agreement", "Token legal opinion", "Terms & conditions", "Privacy policy", "Risk disclosures", "Compliance framework", "Director/nominee services", "Bank account opening support"]',
    '["Registered legal entity", "Certificate of incorporation", "Operating documents", "Legal opinion letter", "Compliance documentation package"]',
    '["Malta", "Isle of Man", "Cayman Islands", "British Virgin Islands", "Gibraltar"]',
    true,
    true,
    true,
    false,
    false,
    4,
    'active'
),
(
    'Technical Setup Only',
    'Smart Contract Development & Deployment',
    'Professional smart contract development, auditing, and deployment. ERC-20, ERC-721, ERC-1155, or custom protocols. Includes security audit and testnet deployment.',
    'technical-setup',
    12000.00,
    13200.00,
    60,
    true,
    true,
    true,
    '["Token standard selection", "Smart contract development", "Custom functionality", "Security audit (CertiK/Quantstamp)", "Testnet deployment", "Mainnet deployment", "Token minting", "Admin dashboard", "Documentation", "Source code delivery"]',
    '["Audited smart contract", "Deployment on mainnet", "Admin dashboard", "Technical documentation", "Full source code", "Audit report"]',
    '["Ethereum", "Polygon", "Binance Smart Chain", "Arbitrum", "Optimism", "Base", "Avalanche"]',
    false,
    false,
    true,
    false,
    false,
    5,
    'active'
),
(
    'Marketing & Launch Support',
    'Token Launch Marketing Package',
    'Comprehensive marketing and community building for your token launch. Includes website, social media, PR, influencer outreach, and community management.',
    'marketing',
    18000.00,
    19800.00,
    50,
    true,
    true,
    true,
    '["Token website design & development", "Whitepaper design", "Social media setup", "Content creation (30 days)", "PR campaign", "Influencer outreach", "Community management", "Launch event planning", "Media kit creation", "Exchange listing strategy", "Analytics dashboard"]',
    '["Professional token website", "Designed whitepaper", "Social media presence", "PR coverage", "Community of 1000+ members", "Media kit", "Launch event", "30-day post-launch support"]',
    '["Global"]',
    false,
    false,
    true,
    false,
    false,
    6,
    'active'
);

-- Enable RLS
ALTER TABLE public.tokenization_services ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active services
CREATE POLICY "Public can read active tokenization services"
ON public.tokenization_services
FOR SELECT
USING (status = 'active');

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage tokenization services"
ON public.tokenization_services
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
);
