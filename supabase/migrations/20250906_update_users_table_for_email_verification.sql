-- Migration: Update users table for email verification
-- Date: 2025-09-06
-- Purpose: Add first_name, last_name fields and email verification support

-- Add columns only if they don't exist
DO $$
BEGIN
    -- Add first_name if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'first_name') THEN
        ALTER TABLE public.users ADD COLUMN first_name text;
    END IF;

    -- Add last_name if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'last_name') THEN
        ALTER TABLE public.users ADD COLUMN last_name text;
    END IF;

    -- Add email_confirmation_token if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email_confirmation_token') THEN
        ALTER TABLE public.users ADD COLUMN email_confirmation_token text;
    END IF;

    -- Add email_confirmation_sent_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email_confirmation_sent_at') THEN
        ALTER TABLE public.users ADD COLUMN email_confirmation_sent_at timestamptz;
    END IF;

    -- Add is_active if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_active') THEN
        ALTER TABLE public.users ADD COLUMN is_active boolean DEFAULT false;
    END IF;
END $$;

-- Update existing records to split name into first_name/last_name if name exists and first_name is null
UPDATE public.users
SET
  first_name = CASE
    WHEN name IS NOT NULL AND position(' ' in name) > 0
    THEN split_part(name, ' ', 1)
    ELSE name
  END,
  last_name = CASE
    WHEN name IS NOT NULL AND position(' ' in name) > 0
    THEN substring(name from position(' ' in name) + 1)
    ELSE NULL
  END
WHERE name IS NOT NULL AND first_name IS NULL;

-- Create index for email confirmation token
CREATE INDEX IF NOT EXISTS idx_users_email_confirmation_token ON public.users(email_confirmation_token);

-- Add comment to explain the migration
COMMENT ON COLUMN public.users.first_name IS 'User first name - separated from original name field';
COMMENT ON COLUMN public.users.last_name IS 'User last name - separated from original name field';
COMMENT ON COLUMN public.users.email_confirmation_token IS 'Token for email verification';
COMMENT ON COLUMN public.users.email_confirmation_sent_at IS 'Timestamp when confirmation email was sent';
COMMENT ON COLUMN public.users.is_active IS 'User account active status - true after email verification';
