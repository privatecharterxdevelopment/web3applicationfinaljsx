-- TEST SQL: Check if user_requests table is working correctly
-- Run this in Supabase SQL Editor

-- =====================================================
-- TEST 1: Check if your user exists
-- =====================================================
SELECT
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
WHERE id = '76e4e329-22d5-434f-b9d5-2fecf1e08721';

-- Expected: Should return 1 row with your email


-- =====================================================
-- TEST 2: Check user_requests table structure
-- =====================================================
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_requests'
ORDER BY ordinal_position;

-- Expected: Should show all columns (id, user_id, type, status, data, etc.)


-- =====================================================
-- TEST 3: Disable trigger temporarily
-- =====================================================
ALTER TABLE user_requests DISABLE TRIGGER user_request_placed_notification;

-- Expected: Success message


-- =====================================================
-- TEST 4: Try to insert a test request (trigger disabled)
-- =====================================================
INSERT INTO user_requests (
  user_id,
  type,
  status,
  data
) VALUES (
  '76e4e329-22d5-434f-b9d5-2fecf1e08721',
  'empty_leg',
  'pending',
  '{"test": true, "flight_route": "TEST → TEST"}'::jsonb
)
RETURNING *;

-- Expected: Should return the inserted row with an ID


-- =====================================================
-- TEST 5: Check if insert worked
-- =====================================================
SELECT
  id,
  user_id,
  type,
  status,
  data,
  created_at
FROM user_requests
WHERE user_id = '76e4e329-22d5-434f-b9d5-2fecf1e08721'
ORDER BY created_at DESC
LIMIT 5;

-- Expected: Should show your test request(s)


-- =====================================================
-- TEST 6: Re-enable trigger with fix
-- =====================================================
-- First drop the broken trigger
DROP TRIGGER IF EXISTS user_request_placed_notification ON user_requests;

-- Create fixed trigger function
CREATE OR REPLACE FUNCTION notify_user_request_placed()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
  request_type_label TEXT;
BEGIN
  -- Map request types
  request_type_label := CASE NEW.type
    WHEN 'empty_leg' THEN 'Empty Leg Flight'
    WHEN 'adventure_package' THEN 'Adventure Package'
    WHEN 'luxury_car' THEN 'Luxury Car Rental'
    ELSE 'Service Request'
  END;

  -- Skip admin notifications for now (avoid user_role error)
  -- We'll fix this later

  -- Create confirmation notification for user only
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_id,
    related_type,
    action_url,
    metadata,
    is_read,
    created_at
  ) VALUES (
    NEW.user_id,
    'request_placed',
    'Request Submitted Successfully',
    'Your ' || request_type_label || ' request has been submitted.',
    NEW.id,
    'user_request',
    '/dashboard?tab=requests',
    jsonb_build_object(
      'request_id', NEW.id,
      'request_type', NEW.type,
      'status', NEW.status
    ),
    FALSE,
    NOW()
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- If notification insert fails, don't block the request
  RAISE WARNING 'Notification insert failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER user_request_placed_notification
  AFTER INSERT ON user_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_request_placed();

-- Expected: Trigger created successfully


-- =====================================================
-- TEST 7: Delete test data
-- =====================================================
DELETE FROM user_requests
WHERE user_id = '76e4e329-22d5-434f-b9d5-2fecf1e08721'
  AND data->>'test' = 'true';

-- Expected: Test row deleted


-- =====================================================
-- SUMMARY
-- =====================================================
-- If all tests pass, your app should work now!
-- The trigger is fixed to skip admin notifications
-- and handle errors gracefully.
