-- FIX: Remove user_role column reference from trigger
-- Problem: auth.users doesn't have user_role column
-- Solution: Check user_profiles table OR skip admin notification for now

-- =====================================================
-- FIXED TRIGGER: Notify when user places a request
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

  -- Create notification for all admin users
  -- Check user_profiles table for role OR raw_app_meta_data
  FOR admin_record IN
    SELECT up.user_id as id
    FROM user_profiles up
    WHERE up.role = 'admin'

    UNION

    SELECT u.id
    FROM auth.users u
    WHERE u.raw_app_meta_data->>'role' = 'admin'
  LOOP
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
      admin_record.id,
      'request_placed',
      'New ' || request_type_label || ' Request',
      'A new request has been submitted and requires your attention.',
      NEW.id,
      'user_request',
      '/admin/requests',
      jsonb_build_object(
        'request_id', NEW.id,
        'request_type', NEW.type,
        'user_id', NEW.user_id,
        'status', NEW.status
      ),
      FALSE,
      NOW()
    );
  END LOOP;

  -- Create confirmation notification for the user who placed the request
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
    'Your ' || request_type_label || ' request has been submitted. We''ll get back to you within 24 hours.',
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS user_request_placed_notification ON user_requests;
CREATE TRIGGER user_request_placed_notification
  AFTER INSERT ON user_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_request_placed();
