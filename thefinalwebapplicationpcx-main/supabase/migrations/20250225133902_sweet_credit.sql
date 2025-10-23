/*
  # Insert Default Logo URL

  1. Changes
    - Updates the company_settings table with a default logo URL
    - Uses a professional aviation-themed logo from a reliable source
*/

-- Update company settings with a default logo
UPDATE company_settings
SET logo_url = 'https://raw.githubusercontent.com/stackblitz/private-jet-icons/main/logo.webp',
    updated_at = now()
WHERE logo_url IS NULL;