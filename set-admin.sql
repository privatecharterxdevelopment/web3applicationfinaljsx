-- Set user as admin
-- Replace YOUR_USER_ID with your actual user ID: 76e4e329-22d5-434f-b9d5-2fecf1e08721

-- Method 1: Update auth.users metadata
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE id = '76e4e329-22d5-434f-b9d5-2fecf1e08721';

-- Method 2: Update user_profiles table (if it has user_role column)
UPDATE user_profiles
SET user_role = 'admin'
WHERE user_id = '76e4e329-22d5-434f-b9d5-2fecf1e08721';

-- Verify
SELECT id, email, raw_user_meta_data->>'role' as role
FROM auth.users
WHERE id = '76e4e329-22d5-434f-b9d5-2fecf1e08721';

SELECT user_id, email, user_role
FROM user_profiles
WHERE user_id = '76e4e329-22d5-434f-b9d5-2fecf1e08721';
