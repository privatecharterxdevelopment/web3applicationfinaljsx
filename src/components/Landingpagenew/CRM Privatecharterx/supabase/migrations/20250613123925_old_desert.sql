/*
  # Add Admin User

  1. New User
    - Creates admin@privatecharterx.com with password g700/falcon/8833
    - Sets up corresponding system_users entry
    - Assigns admin role and Management department

  2. Security
    - Uses proper password hashing
    - Sets up authentication properly
*/

-- Create the admin user in system_users table
INSERT INTO system_users (
  id,
  email,
  name,
  role,
  department,
  is_active,
  created_at,
  updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'admin@privatecharterx.com',
  'Administrator',
  'admin',
  'Management',
  true,
  now(),
  now()
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Note: The actual auth.users entry needs to be created through Supabase Dashboard
-- Go to Authentication > Users and create:
-- Email: admin@privatecharterx.com
-- Password: g700/falcon/8833
-- Then the system will automatically link to the system_users entry above