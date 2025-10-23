-- =====================================================
-- TOKENIZATION SYSTEM - DATABASE MIGRATION
-- Compatible with existing tables (users, user_requests, user_documents, user_profiles)
-- =====================================================

-- 1. Create tokenization_drafts table for saving progress
CREATE TABLE IF NOT EXISTS public.tokenization_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Token Type & Basic Info
    token_type TEXT CHECK (token_type IN ('utility', 'security')),
    current_step INTEGER DEFAULT 1,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'cancelled')),

    -- Asset Information (Step 2)
    asset_name TEXT,
    asset_category TEXT,
    asset_description TEXT,
    asset_value DECIMAL(18, 2),
    asset_location TEXT,
    logo_url TEXT,
    header_image_url TEXT,

    -- Token Configuration (Step 3)
    token_standard TEXT,
    total_supply BIGINT,
    token_symbol TEXT,
    price_per_token DECIMAL(18, 6),
    minimum_investment DECIMAL(18, 2),
    expected_apy DECIMAL(5, 2),
    revenue_distribution TEXT CHECK (revenue_distribution IN ('monthly', 'quarterly', 'annually')),
    revenue_currency TEXT CHECK (revenue_currency IN ('USDC', 'USDT')),
    lockup_period INTEGER, -- in months

    -- Security Token Specific
    has_spv BOOLEAN DEFAULT false,
    spv_details TEXT,
    operator TEXT CHECK (operator IN ('owner', 'third-party', 'pcx-partners')),
    management_fee DECIMAL(5, 2), -- 2% or 3%

    -- Utility Token Specific
    access_rights TEXT,
    validity_period TEXT,
    is_transferable BOOLEAN DEFAULT true,
    is_burnable BOOLEAN DEFAULT false,

    -- Compliance
    jurisdiction TEXT,
    needs_audit BOOLEAN DEFAULT false,

    -- Legal Documents (references to user_documents table)
    prospectus_document_id UUID REFERENCES public.user_documents(id),
    legal_opinion_document_id UUID REFERENCES public.user_documents(id),
    ownership_proof_document_id UUID REFERENCES public.user_documents(id),
    insurance_document_id UUID REFERENCES public.user_documents(id),

    -- Complete form data as JSON (backup)
    form_data JSONB,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT valid_step CHECK (current_step BETWEEN 1 AND 6)
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tokenization_drafts_user_id ON public.tokenization_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_tokenization_drafts_status ON public.tokenization_drafts(status);
CREATE INDEX IF NOT EXISTS idx_tokenization_drafts_created_at ON public.tokenization_drafts(created_at DESC);

-- 3. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_tokenization_draft_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tokenization_draft_timestamp
    BEFORE UPDATE ON public.tokenization_drafts
    FOR EACH ROW
    EXECUTE FUNCTION update_tokenization_draft_timestamp();

-- 4. Create Storage Buckets for user uploads (Run these in Supabase Dashboard or via API)
-- Note: These commands are for reference - execute them via Supabase Dashboard Storage section

-- Bucket for user logo and header images
-- Name: tokenization-images
-- Public: true (for displaying)
-- File size limit: 10MB
-- Allowed MIME types: image/png, image/jpeg, image/jpg, image/svg+xml

-- Bucket for legal documents (per user, private)
-- Name: tokenization-documents
-- Public: false (private, requires auth)
-- File size limit: 50MB
-- Allowed MIME types: application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document

-- 5. Storage Policies (RLS - Row Level Security)

-- Policy for tokenization-images bucket (users can upload/read their own images)
-- CREATE POLICY "Users can upload their own tokenization images"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   bucket_id = 'tokenization-images'
--   AND (storage.foldername(name))[1] = auth.uid()::text
-- );

-- CREATE POLICY "Users can read their own tokenization images"
-- ON storage.objects FOR SELECT
-- TO authenticated
-- USING (
--   bucket_id = 'tokenization-images'
--   AND (storage.foldername(name))[1] = auth.uid()::text
-- );

-- CREATE POLICY "Users can update their own tokenization images"
-- ON storage.objects FOR UPDATE
-- TO authenticated
-- USING (
--   bucket_id = 'tokenization-images'
--   AND (storage.foldername(name))[1] = auth.uid()::text
-- );

-- CREATE POLICY "Users can delete their own tokenization images"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (
--   bucket_id = 'tokenization-images'
--   AND (storage.foldername(name))[1] = auth.uid()::text
-- );

-- Policy for tokenization-documents bucket (users can only access their own docs)
-- CREATE POLICY "Users can upload their own tokenization documents"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   bucket_id = 'tokenization-documents'
--   AND (storage.foldername(name))[1] = auth.uid()::text
-- );

-- CREATE POLICY "Users can read their own tokenization documents"
-- ON storage.objects FOR SELECT
-- TO authenticated
-- USING (
--   bucket_id = 'tokenization-documents'
--   AND (storage.foldername(name))[1] = auth.uid()::text
-- );

-- CREATE POLICY "Admins can read all tokenization documents"
-- ON storage.objects FOR SELECT
-- TO authenticated
-- USING (
--   bucket_id = 'tokenization-documents'
--   AND (
--     (storage.foldername(name))[1] = auth.uid()::text
--     OR EXISTS (
--       SELECT 1 FROM public.users
--       WHERE id = auth.uid() AND is_admin = true
--     )
--   )
-- );

-- 6. RLS Policies for tokenization_drafts table
ALTER TABLE public.tokenization_drafts ENABLE ROW LEVEL SECURITY;

-- Users can view their own drafts
CREATE POLICY "Users can view their own tokenization drafts"
ON public.tokenization_drafts FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can create their own drafts
CREATE POLICY "Users can create their own tokenization drafts"
ON public.tokenization_drafts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own drafts
CREATE POLICY "Users can update their own tokenization drafts"
ON public.tokenization_drafts FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Users can delete their own drafts
CREATE POLICY "Users can delete their own tokenization drafts"
ON public.tokenization_drafts FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Admins can view all drafts
CREATE POLICY "Admins can view all tokenization drafts"
ON public.tokenization_drafts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- 7. Extend user_documents table to support tokenization documents (already exists, just add types)
-- No schema change needed - just use document_type field with values:
-- 'tokenization_prospectus', 'tokenization_legal_opinion',
-- 'tokenization_ownership_proof', 'tokenization_insurance'

-- 8. Create helper view for user's tokenization assets
CREATE OR REPLACE VIEW public.user_tokenization_assets AS
SELECT
    d.id,
    d.user_id,
    d.token_type,
    d.asset_name,
    d.asset_category,
    d.asset_value,
    d.logo_url,
    d.header_image_url,
    d.status,
    d.current_step,
    d.created_at,
    d.updated_at,
    d.submitted_at,
    u.email as user_email,
    u.name as user_name,
    -- Calculate completion percentage
    CASE
        WHEN d.token_type = 'security' THEN (d.current_step::float / 6.0 * 100)::int
        WHEN d.token_type = 'utility' THEN (d.current_step::float / 5.0 * 100)::int
        ELSE 0
    END as completion_percentage
FROM public.tokenization_drafts d
JOIN public.users u ON d.user_id = u.id;

-- 9. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tokenization_drafts TO authenticated;
GRANT SELECT ON public.user_tokenization_assets TO authenticated;

-- =====================================================
-- STORAGE BUCKET CREATION (Execute these separately in Supabase Dashboard or via API)
-- =====================================================

-- Go to Supabase Dashboard > Storage and create these buckets manually:

-- BUCKET 1: tokenization-images
-- Settings:
--   - Name: tokenization-images
--   - Public: Yes
--   - File size limit: 10 MB
--   - Allowed MIME types: image/png, image/jpeg, image/jpg, image/svg+xml, image/webp

-- BUCKET 2: tokenization-documents
-- Settings:
--   - Name: tokenization-documents
--   - Public: No
--   - File size limit: 50 MB
--   - Allowed MIME types: application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document

-- =====================================================
-- TESTING QUERIES
-- =====================================================

-- Test: Create a draft
-- INSERT INTO public.tokenization_drafts (user_id, token_type, asset_name, current_step)
-- VALUES (auth.uid(), 'security', 'Test Private Jet', 2);

-- Test: Get user's drafts
-- SELECT * FROM public.user_tokenization_assets WHERE user_id = auth.uid();

-- Test: Update draft progress
-- UPDATE public.tokenization_drafts
-- SET current_step = 3, asset_value = 5000000
-- WHERE id = 'your-draft-id' AND user_id = auth.uid();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Summary:
-- ✅ tokenization_drafts table created with all fields
-- ✅ Indexes created for performance
-- ✅ RLS policies enabled for security
-- ✅ Helper view created for easy querying
-- ✅ Storage bucket structure defined
-- ✅ Compatible with existing tables (no breaking changes)
--
-- Next Steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Create storage buckets manually in Dashboard
-- 3. Update TypeScript types file
-- 4. Implement draft save/load in frontend
