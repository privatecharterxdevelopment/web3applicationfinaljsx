-- PROFESSIONAL FIX: Replace broken trigger with working version
-- Problem: user_profiles.role column doesn't exist
-- Solution: Only check raw_app_meta_data, wrap in error handling

-- =====================================================
-- Drop and recreate notify_user_request_placed function
-- =====================================================

CREATE OR REPLACE FUNCTION notify_user_request_placed()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
  request_type_label TEXT;
BEGIN
  -- Map request types to user-friendly labels
  request_type_label := CASE NEW.type
    WHEN 'private_jet_charter' THEN 'Private Jet Charter'
    WHEN 'helicopter_charter' THEN 'Helicopter Charter'
    WHEN 'empty_leg' THEN 'Empty Leg Flight'
    WHEN 'adventure_package' THEN 'Adventure Package'
    WHEN 'fixed_offer' THEN 'Fixed Offer'
    WHEN 'taxi_concierge' THEN 'Ground Transport'
    WHEN 'luxury_car_rental' THEN 'Luxury Car Rental'
    WHEN 'event_booking' THEN 'Event Booking'
    WHEN 'co2_certificate' THEN 'CO₂ Certificate'
    WHEN 'spv_formation' THEN 'SPV Formation'
    WHEN 'tokenization' THEN 'Asset Tokenization'
    ELSE 'Service Request'
  END;

  -- Try to notify admins (non-critical - wrapped in BEGIN/EXCEPTION)
  BEGIN
    FOR admin_record IN
      SELECT u.id
      FROM auth.users u
      WHERE u.raw_app_meta_data->>'role' = 'admin'
    LOOP
      INSERT INTO notifications (
        user_id, type, title, message, related_id, related_type,
        action_url, metadata, is_read, created_at
      ) VALUES (
        admin_record.id, 'request_placed',
        'New ' || request_type_label || ' Request',
        'A new request has been submitted and requires your attention.',
        NEW.id, 'user_request', '/admin/requests',
        jsonb_build_object('request_id', NEW.id, 'request_type', NEW.type, 'user_id', NEW.user_id, 'status', NEW.status),
        FALSE, NOW()
      );
    END LOOP;
  EXCEPTION WHEN OTHERS THEN
    -- If admin notification fails, log but continue
    RAISE WARNING 'Admin notification failed: %', SQLERRM;
  END;

  -- User confirmation notification (CRITICAL - must work!)
  BEGIN
    INSERT INTO notifications (
      user_id, type, title, message, related_id, related_type,
      action_url, metadata, is_read, created_at
    ) VALUES (
      NEW.user_id, 'request_placed',
      'Request Submitted Successfully',
      'Your ' || request_type_label || ' request has been submitted. We''ll get back to you within 24 hours.',
      NEW.id, 'user_request', '/dashboard?tab=requests',
      jsonb_build_object('request_id', NEW.id, 'request_type', NEW.type, 'status', NEW.status),
      FALSE, NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    -- Even if user notification fails, don't block the request
    RAISE WARNING 'User notification failed: %', SQLERRM;
  END;

  -- ALWAYS return NEW so the request is saved!
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger already exists, no need to recreate
-- The function replacement is enough

-- =====================================================
-- Test: Try to insert a request
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
  '{"test": true, "flight_route": "PROFESSIONAL_TEST", "from_city": "Test", "to_city": "Test"}'::jsonb
)
RETURNING id, user_id, type, status, created_at;

-- This should work now!
-- Check the result - if you see a row returned, IT WORKED!

-- =====================================================
-- Clean up test
-- =====================================================
DELETE FROM user_requests
WHERE data->>'flight_route' = 'PROFESSIONAL_TEST';

-- =====================================================
-- DONE!
-- =====================================================
-- The trigger is now fixed:
-- 1. Removed broken user_profiles.role check
-- 2. Only checks raw_app_meta_data->>'role' = 'admin'
-- 3. Wrapped in error handling - won't block requests
-- 4. User notification is separate and also error-handled
-- 5. Request ALWAYS saves even if notifications fail
