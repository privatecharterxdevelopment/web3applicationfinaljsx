/*
  # Add Mock Users Without ID Conflicts

  1. New Users
    - Add mock users to system_users table without changing existing IDs
    - Create corresponding auth users with proper credentials
    - Set up proper roles and departments

  2. Security
    - Preserve existing foreign key relationships
    - Avoid ID conflicts with existing users
    - Maintain data integrity
*/

-- First check if users already exist and only insert if they don't
DO $$
DECLARE
  user_exists boolean;
  user_id uuid;
BEGIN
  -- Check aschaufelberger
  SELECT EXISTS(SELECT 1 FROM system_users WHERE email = 'aschaufelberger@privatecharterx.com') INTO user_exists;
  IF NOT user_exists THEN
    INSERT INTO system_users (
      email,
      name,
      role,
      department,
      is_active,
      hire_date,
      created_at,
      updated_at
    ) VALUES (
      'aschaufelberger@privatecharterx.com',
      'Andrin Schaufelberger',
      'admin',
      'Management',
      true,
      CURRENT_DATE,
      now(),
      now()
    );
    RAISE NOTICE 'Added aschaufelberger@privatecharterx.com to system_users';
  ELSE
    -- Just update role and department without changing ID
    UPDATE system_users 
    SET 
      name = 'Andrin Schaufelberger',
      role = 'admin',
      department = 'Management',
      is_active = true,
      updated_at = now()
    WHERE email = 'aschaufelberger@privatecharterx.com';
    RAISE NOTICE 'Updated aschaufelberger@privatecharterx.com in system_users';
  END IF;

  -- Check moreno.vanza
  SELECT EXISTS(SELECT 1 FROM system_users WHERE email = 'moreno.vanza@privatecharterx.com') INTO user_exists;
  IF NOT user_exists THEN
    INSERT INTO system_users (
      email,
      name,
      role,
      department,
      is_active,
      hire_date,
      created_at,
      updated_at
    ) VALUES (
      'moreno.vanza@privatecharterx.com',
      'Moreno Vanza',
      'employee',
      'Operations',
      true,
      CURRENT_DATE,
      now(),
      now()
    );
    RAISE NOTICE 'Added moreno.vanza@privatecharterx.com to system_users';
  ELSE
    -- Just update role and department without changing ID
    UPDATE system_users 
    SET 
      name = 'Moreno Vanza',
      role = 'employee',
      department = 'Operations',
      is_active = true,
      updated_at = now()
    WHERE email = 'moreno.vanza@privatecharterx.com';
    RAISE NOTICE 'Updated moreno.vanza@privatecharterx.com in system_users';
  END IF;

  -- Check claudio.steyskal
  SELECT EXISTS(SELECT 1 FROM system_users WHERE email = 'claudio.steyskal@privatecharterx.com') INTO user_exists;
  IF NOT user_exists THEN
    INSERT INTO system_users (
      email,
      name,
      role,
      department,
      is_active,
      hire_date,
      created_at,
      updated_at
    ) VALUES (
      'claudio.steyskal@privatecharterx.com',
      'Claudio Steyskal',
      'employee',
      'Operations',
      true,
      CURRENT_DATE,
      now(),
      now()
    );
    RAISE NOTICE 'Added claudio.steyskal@privatecharterx.com to system_users';
  ELSE
    -- Just update role and department without changing ID
    UPDATE system_users 
    SET 
      name = 'Claudio Steyskal',
      role = 'employee',
      department = 'Operations',
      is_active = true,
      updated_at = now()
    WHERE email = 'claudio.steyskal@privatecharterx.com';
    RAISE NOTICE 'Updated claudio.steyskal@privatecharterx.com in system_users';
  END IF;

  -- Check simon.kulik
  SELECT EXISTS(SELECT 1 FROM system_users WHERE email = 'simon.kulik@privatecharterx.com') INTO user_exists;
  IF NOT user_exists THEN
    INSERT INTO system_users (
      email,
      name,
      role,
      department,
      is_active,
      hire_date,
      created_at,
      updated_at
    ) VALUES (
      'simon.kulik@privatecharterx.com',
      'Simon Kulik',
      'sales',
      'Sales',
      true,
      CURRENT_DATE,
      now(),
      now()
    );
    RAISE NOTICE 'Added simon.kulik@privatecharterx.com to system_users';
  ELSE
    -- Just update role and department without changing ID
    UPDATE system_users 
    SET 
      name = 'Simon Kulik',
      role = 'sales',
      department = 'Sales',
      is_active = true,
      updated_at = now()
    WHERE email = 'simon.kulik@privatecharterx.com';
    RAISE NOTICE 'Updated simon.kulik@privatecharterx.com in system_users';
  END IF;
END $$;

-- Create a function to safely add auth users
CREATE OR REPLACE FUNCTION add_mock_auth_users() RETURNS void AS $$
DECLARE
  mock_user RECORD;
  user_exists boolean;
  system_user_id uuid;
BEGIN
  -- For each email we want to add
  FOR mock_user IN 
    SELECT * FROM (VALUES
      ('aschaufelberger@privatecharterx.com', 'password123'),
      ('moreno.vanza@privatecharterx.com', 'password123'),
      ('claudio.steyskal@privatecharterx.com', 'password123'),
      ('simon.kulik@privatecharterx.com', 'password123')
    ) AS t(email, password)
  LOOP
    -- Check if auth user already exists
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = mock_user.email) INTO user_exists;
    
    -- Get the system_user ID for this email
    SELECT id INTO system_user_id FROM system_users WHERE email = mock_user.email;
    
    IF system_user_id IS NULL THEN
      RAISE NOTICE 'Cannot create auth user for %: No matching system_user found', mock_user.email;
      CONTINUE;
    END IF;
    
    IF NOT user_exists THEN
      BEGIN
        -- Get user details from system_users
        DECLARE
          user_role text;
          user_name text;
        BEGIN
          SELECT role, name INTO user_role, user_name FROM system_users WHERE id = system_user_id;
          
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
            system_user_id,
            '00000000-0000-0000-0000-000000000000',
            mock_user.email,
            crypt(mock_user.password, gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider": "email", "providers": ["email"]}'::jsonb,
            jsonb_build_object(
              'name', user_name,
              'role', user_role,
              'is_admin', user_role = 'admin'
            ),
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
            system_user_id::text,
            system_user_id,
            jsonb_build_object(
              'sub', system_user_id::text,
              'email', mock_user.email,
              'email_verified', true,
              'phone_verified', false
            ),
            'email',
            now(),
            now(),
            now(),
            mock_user.email
          );

          RAISE NOTICE 'Created auth user: %', mock_user.email;
        END;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Failed to create auth user %: %', mock_user.email, SQLERRM;
      END;
    ELSE
      RAISE NOTICE 'Auth user already exists: %', mock_user.email;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function to create the auth users
SELECT add_mock_auth_users();

-- Clean up
DROP FUNCTION add_mock_auth_users();

-- Final verification
DO $$
BEGIN
  RAISE NOTICE 'Verifying mock users...';
  
  -- Check system_users
  IF EXISTS (SELECT 1 FROM system_users WHERE email = 'aschaufelberger@privatecharterx.com') THEN
    RAISE NOTICE 'aschaufelberger@privatecharterx.com exists in system_users';
  END IF;
  
  IF EXISTS (SELECT 1 FROM system_users WHERE email = 'moreno.vanza@privatecharterx.com') THEN
    RAISE NOTICE 'moreno.vanza@privatecharterx.com exists in system_users';
  END IF;
  
  IF EXISTS (SELECT 1 FROM system_users WHERE email = 'claudio.steyskal@privatecharterx.com') THEN
    RAISE NOTICE 'claudio.steyskal@privatecharterx.com exists in system_users';
  END IF;
  
  IF EXISTS (SELECT 1 FROM system_users WHERE email = 'simon.kulik@privatecharterx.com') THEN
    RAISE NOTICE 'simon.kulik@privatecharterx.com exists in system_users';
  END IF;
  
  -- Check auth.users
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'aschaufelberger@privatecharterx.com') THEN
    RAISE NOTICE 'aschaufelberger@privatecharterx.com exists in auth.users';
  END IF;
  
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'moreno.vanza@privatecharterx.com') THEN
    RAISE NOTICE 'moreno.vanza@privatecharterx.com exists in auth.users';
  END IF;
  
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'claudio.steyskal@privatecharterx.com') THEN
    RAISE NOTICE 'claudio.steyskal@privatecharterx.com exists in auth.users';
  END IF;
  
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'simon.kulik@privatecharterx.com') THEN
    RAISE NOTICE 'simon.kulik@privatecharterx.com exists in auth.users';
  END IF;
END $$;