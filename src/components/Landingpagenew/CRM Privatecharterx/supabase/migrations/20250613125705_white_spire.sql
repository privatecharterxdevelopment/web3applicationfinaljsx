/*
  # Add Lorenzo User

  1. New User
    - Add Lorenzo.vanza@hotmail.com to system_users table
    - Set as employee role with Operations department
    - Create corresponding auth.users entry

  2. Security
    - User will have employee-level access
    - Standard RLS policies will apply
*/

-- First, add the user to system_users table
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
) VALUES (
  '550e8400-e29b-41d4-a716-446655440004',
  'Lorenzo.vanza@hotmail.com',
  'Lorenzo Vanza',
  'employee',
  'Operations',
  true,
  CURRENT_DATE,
  now(),
  now()
) ON CONFLICT (email) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Create a function to safely add the auth user
CREATE OR REPLACE FUNCTION add_lorenzo_auth_user() RETURNS boolean AS $$
DECLARE
  user_id uuid := '550e8400-e29b-41d4-a716-446655440004';
  user_email text := 'Lorenzo.vanza@hotmail.com';
  user_password text := 'testing132';
  result boolean := false;
BEGIN
  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
    RAISE NOTICE 'User % already exists in auth.users', user_email;
    RETURN true;
  END IF;

  BEGIN
    -- Insert the auth user
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
      '{}'::jsonb,
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
    RAISE NOTICE 'Successfully created auth user: %', user_email;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Failed to create auth user %: %', user_email, SQLERRM;
    result := false;
  END;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function to create the auth user
SELECT add_lorenzo_auth_user();

-- Clean up the function
DROP FUNCTION add_lorenzo_auth_user();

-- Verify the user was created
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM system_users WHERE email = 'Lorenzo.vanza@hotmail.com') THEN
    RAISE NOTICE 'Lorenzo user verified in system_users table';
  ELSE
    RAISE NOTICE 'Lorenzo user NOT found in system_users table';
  END IF;
  
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'Lorenzo.vanza@hotmail.com') THEN
    RAISE NOTICE 'Lorenzo user verified in auth.users table';
  ELSE
    RAISE NOTICE 'Lorenzo user NOT found in auth.users table';
  END IF;
END $$;