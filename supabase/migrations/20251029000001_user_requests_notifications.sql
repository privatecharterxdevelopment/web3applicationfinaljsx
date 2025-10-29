-- Migration: Add notification triggers for user_requests table
-- Creates bell notifications when users place requests and when admins respond

-- =====================================================
-- TRIGGER 1: Notify when user places a request
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
  FOR admin_record IN
    SELECT id FROM auth.users WHERE user_role = 'admin'
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

-- Create trigger on user_requests INSERT
DROP TRIGGER IF EXISTS user_request_placed_notification ON user_requests;
CREATE TRIGGER user_request_placed_notification
  AFTER INSERT ON user_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_request_placed();

-- =====================================================
-- TRIGGER 2: Notify user when admin responds/updates
-- =====================================================

CREATE OR REPLACE FUNCTION notify_user_request_response()
RETURNS TRIGGER AS $$
DECLARE
  notification_type TEXT;
  notification_title TEXT;
  notification_message TEXT;
  request_type_label TEXT;
BEGIN
  -- Only send notification if status changed or admin_notes was added/updated
  IF (OLD.status = NEW.status AND OLD.admin_notes IS NOT DISTINCT FROM NEW.admin_notes) THEN
    RETURN NEW;
  END IF;

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

  -- Determine notification type and message based on status
  IF NEW.status = 'completed' THEN
    notification_type := 'request_confirmed';
    notification_title := request_type_label || ' Request Completed';
    notification_message := 'Your request has been completed successfully!';
  ELSIF NEW.status = 'cancelled' THEN
    notification_type := 'request_rejected';
    notification_title := request_type_label || ' Request Cancelled';
    notification_message := 'Your request has been cancelled.';
  ELSIF NEW.status = 'in_progress' THEN
    notification_type := 'request_confirmed';
    notification_title := request_type_label || ' Request In Progress';
    notification_message := 'Your request is being processed by our team.';
  ELSIF OLD.admin_notes IS DISTINCT FROM NEW.admin_notes AND NEW.admin_notes IS NOT NULL THEN
    -- Admin added notes
    notification_type := 'support_ticket_response';
    notification_title := 'Admin Response on Your ' || request_type_label || ' Request';
    notification_message := 'An admin has responded to your request. Check your request details for more information.';
  ELSE
    -- Status changed but to an unknown status
    notification_type := 'request_confirmed';
    notification_title := 'Update on Your ' || request_type_label || ' Request';
    notification_message := 'Your request status has been updated.';
  END IF;

  -- Create notification for the user
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
    notification_type,
    notification_title,
    notification_message,
    NEW.id,
    'user_request',
    '/dashboard?tab=requests',
    jsonb_build_object(
      'request_id', NEW.id,
      'request_type', NEW.type,
      'status', NEW.status,
      'previous_status', OLD.status,
      'admin_id', NEW.admin_id,
      'admin_notes', NEW.admin_notes
    ),
    FALSE,
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on user_requests UPDATE
DROP TRIGGER IF EXISTS user_request_response_notification ON user_requests;
CREATE TRIGGER user_request_response_notification
  AFTER UPDATE ON user_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_request_response();

-- =====================================================
-- Grant necessary permissions
-- =====================================================

-- Allow service role to insert notifications
GRANT INSERT ON notifications TO service_role;

-- Add comments for documentation
COMMENT ON FUNCTION notify_user_request_placed() IS 'Creates notifications when a user submits a new request';
COMMENT ON FUNCTION notify_user_request_response() IS 'Creates notifications when an admin responds to or updates a user request';
