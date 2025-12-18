/*
  # Fix Authentication Users Setup

  1. Purpose
    - Ensure all demo users exist in both auth.users and system_users tables
    - Fix any authentication issues preventing login
    - Verify user data integrity

  2. Changes
    - Create or update demo users in auth.users table
    - Ensure system_users records are properly linked
    - Add Lorenzo's account with correct credentials
*/

-- First, ensure system_users records exist
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
  ),
  (
    '550e8400-e29b-41d4-a716-446655440004',
    'Lorenzo.vanza@hotmail.com',
    'Lorenzo Vanza',
    'employee',
    'Operations',
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

-- Create a comprehensive function to set up auth users
CREATE OR REPLACE FUNCTION setup_demo_auth_users() RETURNS void AS $$
DECLARE
  demo_users RECORD;
  user_exists boolean;
BEGIN
  -- Define our demo users
  FOR demo_users IN 
    SELECT * FROM (VALUES
      ('550e8400-e29b-41d4-a716-446655440001'::uuid, 'admin@privatecharterx.com', 'password123'),
      ('550e8400-e29b-41d4-a716-446655440002'::uuid, 'employee@privatecharterx.com', 'password123'),
      ('550e8400-e29b-41d4-a716-446655440003'::uuid, 'sales@privatecharterx.com', 'password123'),
      ('550e8400-e29b-41d4-a716-446655440004'::uuid, 'Lorenzo.vanza@hotmail.com', 'testing132')
    ) AS t(user_id, email, password)
  LOOP
    -- Check if user exists
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = demo_users.email) INTO user_exists;
    
    IF NOT user_exists THEN
      BEGIN
        -- Insert auth user
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
          demo_users.user_id,
          '00000000-0000-0000-0000-000000000000',
          demo_users.email,
          crypt(demo_users.password, gen_salt('bf')),
          now(),
          now(),
          now(),
          '{"provider": "email", "providers": ["email"]}'::jsonb,
          CASE 
            WHEN demo_users.email = 'admin@privatecharterx.com' THEN '{"is_admin": true}'::jsonb
            ELSE '{}'::jsonb
          END,
          false,
          'authenticated',
          'authenticated',
          '',
          now(),
          now()
        );

        -- Insert identity
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
          demo_users.user_id::text,
          demo_users.user_id,
          jsonb_build_object(
            'sub', demo_users.user_id::text,
            'email', demo_users.email,
            'email_verified', true,
            'phone_verified', false
          ),
          'email',
          now(),
          now(),
          now(),
          demo_users.email
        );

        RAISE NOTICE 'Created auth user: %', demo_users.email;
        
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Failed to create auth user %: %', demo_users.email, SQLERRM;
      END;
    ELSE
      RAISE NOTICE 'Auth user already exists: %', demo_users.email;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the setup function
SELECT setup_demo_auth_users();

-- Clean up
DROP FUNCTION setup_demo_auth_users();

-- Final verification
DO $$
DECLARE
  auth_count integer;
  system_count integer;
BEGIN
  SELECT COUNT(*) INTO auth_count FROM auth.users WHERE email IN (
    'admin@privatecharterx.com',
    'employee@privatecharterx.com', 
    'sales@privatecharterx.com',
    'Lorenzo.vanza@hotmail.com'
  );
  
  SELECT COUNT(*) INTO system_count FROM system_users WHERE email IN (
    'admin@privatecharterx.com',
    'employee@privatecharterx.com',
    'sales@privatecharterx.com', 
    'Lorenzo.vanza@hotmail.com'
  );
  
  RAISE NOTICE 'Demo users in auth.users: %', auth_count;
  RAISE NOTICE 'Demo users in system_users: %', system_count;
  
  IF auth_count = 4 AND system_count = 4 THEN
    RAISE NOTICE 'SUCCESS: All demo users are properly set up!';
  ELSE
    RAISE NOTICE 'WARNING: Some demo users may be missing!';
  END IF;
END $$;