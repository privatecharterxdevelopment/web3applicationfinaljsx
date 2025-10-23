-- Migration: Update users table for email verification
-- Date: 2025-09-06
-- Purpose: Add first_name, last_name fields and email verification support

-- Add first_name and last_name fields to users table
ALTER TABLE public.users 
ADD COLUMN first_name text,
ADD COLUMN last_name text,
ADD COLUMN email_confirmation_token text,
ADD COLUMN email_confirmation_sent_at timestamptz,
ADD COLUMN is_active boolean DEFAULT false;

-- Update existing records to split name into first_name/last_name if name exists
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
WHERE name IS NOT NULL;

-- Create index for email confirmation token
CREATE INDEX IF NOT EXISTS idx_users_email_confirmation_token ON public.users(email_confirmation_token);

-- Add comment to explain the migration
COMMENT ON COLUMN public.users.first_name IS 'User first name - separated from original name field';
COMMENT ON COLUMN public.users.last_name IS 'User last name - separated from original name field';
COMMENT ON COLUMN public.users.email_confirmation_token IS 'Token for email verification';
COMMENT ON COLUMN public.users.email_confirmation_sent_at IS 'Timestamp when confirmation email was sent';
COMMENT ON COLUMN public.users.is_active IS 'User account active status - true after email verification';