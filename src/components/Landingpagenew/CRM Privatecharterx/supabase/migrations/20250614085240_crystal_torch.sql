/*
  # Update Employees and Fix Calendar Invitations

  1. New Employees
    - Add new employees to system_users table
    - Ensure proper department and role assignments
    - Create corresponding auth users

  2. Calendar Fixes
    - Fix attendees handling in calendar events
    - Ensure proper notification delivery for invitations
    - Fix RLS policies for calendar events
*/

-- Add new employees to system_users table
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
    'mguerini@privatecharterx.com',
    'Moreno Guerini',
    'employee',
    'Business Aviation',
    true,
    CURRENT_DATE,
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'csteyskal@privatecharterx.com',
    'Claudio Steyskal',
    'employee',
    'Operations',
    true,
    CURRENT_DATE,
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'skulik@privatecharterx.com',
    'Simon Kulik',
    'sales',
    'Sales',
    true,
    CURRENT_DATE,
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'dfechner@privatecharterx.com',
    'Dylan Fechner',
    'employee',
    'Customer Service',
    true,
    CURRENT_DATE,
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'aramel@privatecharterx.com',
    'Angela Ramel',
    'sales',
    'Sales',
    true,
    CURRENT_DATE,
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'aschaufelberger@privatecharterx.com',
    'Andrin Schaufelberger',
    'admin',
    'Management',
    true,
    CURRENT_DATE,
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'akoob@privatecharterx.com',
    'Antwan Koob',
    'employee',
    'Business Aviation',
    true,
    CURRENT_DATE,
    now(),
    now()
  )
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Create a function to set up auth users for new employees
CREATE OR REPLACE FUNCTION setup_new_employees_auth() RETURNS void AS $$
DECLARE
  employee RECORD;
  user_exists boolean;
  user_id uuid;
BEGIN
  -- Process each employee
  FOR employee IN 
    SELECT * FROM system_users 
    WHERE email IN (
      'mguerini@privatecharterx.com',
      'csteyskal@privatecharterx.com',
      'skulik@privatecharterx.com',
      'dfechner@privatecharterx.com',
      'aramel@privatecharterx.com',
      'aschaufelberger@privatecharterx.com',
      'akoob@privatecharterx.com'
    )
  LOOP
    -- Check if auth user exists
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = employee.email) INTO user_exists;
    
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
          employee.id,
          '00000000-0000-0000-0000-000000000000',
          employee.email,
          crypt('password123', gen_salt('bf')),
          now(),
          now(),
          now(),
          '{"provider": "email", "providers": ["email"]}'::jsonb,
          jsonb_build_object(
            'name', employee.name,
            'role', employee.role,
            'is_admin', employee.role = 'admin'
          ),
          false,
          'authenticated',
          'authenticated',
          '',
          now(),
          now()
        );

        -- Get the inserted user ID
        SELECT id INTO user_id FROM auth.users WHERE email = employee.email;

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
          user_id::text,
          user_id,
          jsonb_build_object(
            'sub', user_id::text,
            'email', employee.email,
            'email_verified', true,
            'phone_verified', false
          ),
          'email',
          now(),
          now(),
          now(),
          employee.email
        );

        RAISE NOTICE 'Created auth user: %', employee.email;
        
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Failed to create auth user %: %', employee.email, SQLERRM;
      END;
    ELSE
      RAISE NOTICE 'Auth user already exists: %', employee.email;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the setup function
SELECT setup_new_employees_auth();

-- Clean up
DROP FUNCTION setup_new_employees_auth();

-- Fix calendar events table to properly handle null values for attendees
ALTER TABLE calendar_events 
  ALTER COLUMN attendees SET DEFAULT '{}',
  ALTER COLUMN is_all_day SET DEFAULT false;

-- Create a function to handle calendar event notifications
CREATE OR REPLACE FUNCTION notify_calendar_attendees()
RETURNS TRIGGER AS $$
DECLARE
  attendee_id text;
  event_title text;
  event_date text;
  event_creator text;
BEGIN
  -- Only process if there are attendees
  IF NEW.attendees IS NULL OR array_length(NEW.attendees, 1) IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get event details
  SELECT name INTO event_creator FROM system_users WHERE id = NEW.created_by;
  event_title := NEW.title;
  event_date := to_char(NEW.start_date, 'YYYY-MM-DD');
  
  -- Create notifications for each attendee
  FOREACH attendee_id IN ARRAY NEW.attendees
  LOOP
    -- Skip if attendee ID is not valid
    IF attendee_id IS NULL OR attendee_id = '' THEN
      CONTINUE;
    END IF;
    
    -- Insert notification
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      data,
      is_read
    ) VALUES (
      attendee_id::uuid,
      'calendar_invitation',
      'Calendar Invitation',
      'You have been invited to: ' || event_title,
      jsonb_build_object(
        'event_id', NEW.id,
        'event_title', event_title,
        'event_date', event_date,
        'creator_name', event_creator,
        'start_time', NEW.start_time,
        'end_time', NEW.end_time,
        'location', NEW.location
      ),
      false
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for calendar event notifications
DROP TRIGGER IF EXISTS calendar_event_notification_trigger ON calendar_events;
CREATE TRIGGER calendar_event_notification_trigger
  AFTER INSERT ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION notify_calendar_attendees();

-- Fix RLS policies for calendar events to ensure proper access
DROP POLICY IF EXISTS "Users can read calendar events" ON calendar_events;
CREATE POLICY "Users can read calendar events"
  ON calendar_events
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = created_by OR 
    auth.uid()::text = ANY(COALESCE(attendees, '{}'::text[])) OR
    EXISTS (
      SELECT 1 FROM system_users 
      WHERE system_users.id = auth.uid() 
      AND system_users.role = 'admin'
    )
  );

-- Add a policy for public calendar viewing
DROP POLICY IF EXISTS "Public can read calendar events" ON calendar_events;
CREATE POLICY "Public can read calendar events"
  ON calendar_events
  FOR SELECT
  TO public
  USING (true);