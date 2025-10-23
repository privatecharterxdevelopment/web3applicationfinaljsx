/*
  # Update default logo URL

  1. Changes
    - Update logo_url in company_settings table to new URL
*/

-- Update logo URL in company_settings
UPDATE company_settings 
SET logo_url = 'https://i.imgur.com/iu42DU1.png',
    updated_at = now();