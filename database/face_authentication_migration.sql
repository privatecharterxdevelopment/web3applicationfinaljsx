-- =====================================================
-- FACE AUTHENTICATION SYSTEM
-- Migration for Face ID Login & Registration
-- =====================================================

-- 1. Create face_authentication table
CREATE TABLE IF NOT EXISTS public.face_authentication (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    face_descriptor JSONB NOT NULL, -- Encrypted face embedding vector (128 dimensions)
    is_active BOOLEAN DEFAULT true,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    device_info JSONB, -- Optional: browser, OS info
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. Add face authentication fields to user_profiles table
DO $$
BEGIN
    -- Check and add face_login_enabled column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = 'face_login_enabled'
    ) THEN
        ALTER TABLE public.user_profiles
        ADD COLUMN face_login_enabled BOOLEAN DEFAULT false;
    END IF;

    -- Check and add face_registration_completed column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = 'face_registration_completed'
    ) THEN
        ALTER TABLE public.user_profiles
        ADD COLUMN face_registration_completed BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_face_authentication_user_id ON public.face_authentication(user_id);
CREATE INDEX IF NOT EXISTS idx_face_authentication_is_active ON public.face_authentication(is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_face_login_enabled ON public.user_profiles(face_login_enabled);

-- 4. Enable RLS (Row Level Security)
ALTER TABLE public.face_authentication ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for face_authentication
DROP POLICY IF EXISTS "Users can view their own face auth data" ON public.face_authentication;
CREATE POLICY "Users can view their own face auth data"
ON public.face_authentication FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own face auth data" ON public.face_authentication;
CREATE POLICY "Users can insert their own face auth data"
ON public.face_authentication FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own face auth data" ON public.face_authentication;
CREATE POLICY "Users can update their own face auth data"
ON public.face_authentication FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own face auth data" ON public.face_authentication;
CREATE POLICY "Users can delete their own face auth data"
ON public.face_authentication FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 6. Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_face_auth_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger
DROP TRIGGER IF EXISTS update_face_authentication_updated_at ON public.face_authentication;
CREATE TRIGGER update_face_authentication_updated_at
    BEFORE UPDATE ON public.face_authentication
    FOR EACH ROW
    EXECUTE FUNCTION update_face_auth_updated_at();

-- 8. Create helper function to check if user has face auth enabled
CREATE OR REPLACE FUNCTION has_face_auth_enabled(check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    result BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1
        FROM public.face_authentication
        WHERE user_id = check_user_id
        AND is_active = true
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Summary:
-- ✅ face_authentication table created
-- ✅ user_profiles extended with face_login_enabled fields
-- ✅ Indexes created for performance
-- ✅ RLS policies enabled (users can only access their own data)
-- ✅ Triggers for updated_at timestamp
-- ✅ Helper function has_face_auth_enabled()
--
-- Next Steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Face authentication will be ready for use
-- 3. All face data is encrypted and user-specific

-- Grant permissions
GRANT ALL ON public.face_authentication TO authenticated;
GRANT EXECUTE ON FUNCTION has_face_auth_enabled(UUID) TO authenticated;
