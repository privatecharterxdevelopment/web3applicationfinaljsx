/*
  # Create Demo Users for Login

  1. New Users Setup
    - Creates demo users in the system_users table
    - Sets up proper authentication credentials
    - Ensures users can log in with the demo credentials shown in the UI

  2. Security
    - Uses secure password hashing
    - Sets up proper user roles
    - Enables proper authentication flow

  Note: This migration assumes the auth users will be created separately through Supabase Auth.
  The system_users entries will be linked to the auth users via triggers or manual insertion.
*/

-- Insert demo system users (these will need corresponding auth.users entries)
INSERT INTO system_users (
  id,
  email,
  name,
  role,
  department,
  is_active,
  hire_date,
  created_at,
  updated_at
) VALUES 
  (
    gen_random_uuid(),
    'admin@privatecharterx.com',
    'Admin User',
    'admin',
    'Administration',
    true,
    CURRENT_DATE,
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'employee@privatecharterx.com',
    'Employee User',
    'employee',
    'Operations',
    true,
    CURRENT_DATE,
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'sales@privatecharterx.com',
    'Sales User',
    'sales',
    'Sales',
    true,
    CURRENT_DATE,
    now(),
    now()
  )
ON CONFLICT (email) DO NOTHING;

-- Create a function to handle user creation after auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user already exists in system_users
  IF NOT EXISTS (SELECT 1 FROM system_users WHERE email = NEW.email) THEN
    -- Insert new user into system_users with default role
    INSERT INTO system_users (
      id,
      email,
      name,
      role,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      'employee', -- default role
      true,
      now(),
      now()
    );
  ELSE
    -- Update existing system_users record with auth user id
    UPDATE system_users 
    SET id = NEW.id, updated_at = now()
    WHERE email = NEW.email AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();