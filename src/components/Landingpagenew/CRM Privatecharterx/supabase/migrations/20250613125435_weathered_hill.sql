/*
  # Verify and Create Demo Auth Users

  1. Check if auth users exist
  2. Create them if they don't exist
  3. Ensure system_users records are properly linked
*/

-- First, let's check what auth users exist
DO $$
BEGIN
  RAISE NOTICE 'Checking existing auth users...';
  
  -- Check if our demo users exist in auth.users
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@privatecharterx.com') THEN
    RAISE NOTICE 'Admin user exists in auth.users';
  ELSE
    RAISE NOTICE 'Admin user does NOT exist in auth.users';
  END IF;
  
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'employee@privatecharterx.com') THEN
    RAISE NOTICE 'Employee user exists in auth.users';
  ELSE
    RAISE NOTICE 'Employee user does NOT exist in auth.users';
  END IF;
  
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'sales@privatecharterx.com') THEN
    RAISE NOTICE 'Sales user exists in auth.users';
  ELSE
    RAISE NOTICE 'Sales user does NOT exist in auth.users';
  END IF;
END $$;

-- Ensure system_users records exist with correct IDs
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
    '550e8400-e29b-41d4-a716-446655440001',
    'admin@privatecharterx.com',
    'System Administrator',
    'admin',
    'Administration',
    true,
    CURRENT_DATE,
    now(),
    now()
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002',
    'employee@privatecharterx.com',
    'John Employee',
    'employee',
    'Operations',
    true,
    CURRENT_DATE,
    now(),
    now()
  ),
  (
    '550e8400-e29b-41d4-a716-446655440003',
    'sales@privatecharterx.com',
    'Jane Sales',
    'sales',
    'Sales',
    true,
    CURRENT_DATE,
    now(),
    now()
  )
ON CONFLICT (email) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Create a safer function to create auth users
CREATE OR REPLACE FUNCTION create_auth_user_safe(
  user_id uuid,
  user_email text,
  user_password text
) RETURNS boolean AS $$
DECLARE
  result boolean := false;
BEGIN
  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
    RAISE NOTICE 'User % already exists', user_email;
    RETURN true;
  END IF;

  BEGIN
    -- Try to insert the auth user
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud,
      confirmation_token,
      phone_confirmed_at,
      confirmed_at
    ) VALUES (
      user_id,
      '00000000-0000-0000-0000-000000000000',
      user_email,
      crypt(user_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      CASE 
        WHEN user_email = 'admin@privatecharterx.com' THEN '{"is_admin": true}'::jsonb
        ELSE '{}'::jsonb
      END,
      false,
      'authenticated',
      'authenticated',
      '',
      now(),
      now()
    );

    -- Create the identity record
    INSERT INTO auth.identities (
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at,
      email
    ) VALUES (
      user_id::text,
      user_id,
      jsonb_build_object(
        'sub', user_id::text,
        'email', user_email,
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      now(),
      now(),
      now(),
      user_email
    );

    result := true;
    RAISE NOTICE 'Successfully created user: %', user_email;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Failed to create user %: %', user_email, SQLERRM;
    result := false;
  END;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Try to create the demo users
SELECT create_auth_user_safe(
  '550e8400-e29b-41d4-a716-446655440001',
  'admin@privatecharterx.com',
  'password123'
);

SELECT create_auth_user_safe(
  '550e8400-e29b-41d4-a716-446655440002',
  'employee@privatecharterx.com',
  'password123'
);

SELECT create_auth_user_safe(
  '550e8400-e29b-41d4-a716-446655440003',
  'sales@privatecharterx.com',
  'password123'
);

-- Clean up the function
DROP FUNCTION create_auth_user_safe(uuid, text, text);

-- Final verification
DO $$
BEGIN
  RAISE NOTICE 'Final verification...';
  
  -- Check system_users
  RAISE NOTICE 'System users count: %', (SELECT COUNT(*) FROM system_users);
  
  -- Check auth.users
  RAISE NOTICE 'Auth users count: %', (SELECT COUNT(*) FROM auth.users);
  
  -- Check if our specific users exist
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@privatecharterx.com') THEN
    RAISE NOTICE 'Admin user verified in auth.users';
  END IF;
  
  IF EXISTS (SELECT 1 FROM system_users WHERE email = 'admin@privatecharterx.com') THEN
    RAISE NOTICE 'Admin user verified in system_users';
  END IF;
END $$;