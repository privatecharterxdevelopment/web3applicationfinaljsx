-- =====================================================
-- REAL-TIME NOTIFICATION SYSTEM
-- =====================================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS notifications CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;

-- Create notification type enum
CREATE TYPE notification_type AS ENUM (
  'waitlist_join',
  'p2p_bid',
  'p2p_bid_accepted',
  'p2p_bid_rejected',
  'new_project_launched',
  'project_approved',
  'project_rejected',
  'support_ticket_response',
  'launchpad_bid',
  'token_purchase',
  'token_sale',
  'marketplace_purchase',
  'payment_received',
  'kyc_approved',
  'kyc_rejected',
  'transaction_completed',
  'calendar_entry',
  'request_placed',
  'request_confirmed',
  'request_rejected',
  'payment_link_sent'
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Related entity references (nullable, depends on notification type)
  related_id UUID, -- ID of the related entity (project, bid, ticket, etc.)
  related_type TEXT, -- Type of related entity (project, bid, ticket, etc.)

  -- Notification metadata
  action_url TEXT, -- URL to navigate when notification is clicked
  image_url TEXT, -- Optional image/icon for the notification
  metadata JSONB DEFAULT '{}', -- Additional data (amounts, names, etc.)

  -- Status tracking
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_related ON notifications(related_id, related_type);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- TRIGGER FUNCTIONS FOR AUTO-NOTIFICATIONS
-- =====================================================

-- Function to notify project owner when someone joins waitlist
CREATE OR REPLACE FUNCTION notify_waitlist_join()
RETURNS TRIGGER AS $$
DECLARE
  project_record RECORD;
  project_owner_id UUID;
BEGIN
  -- Get project details and owner
  SELECT p.*, p.created_by
  INTO project_record
  FROM launchpad_projects p
  WHERE p.id = NEW.project_id;

  project_owner_id := project_record.created_by;

  -- Notify project owner
  IF project_owner_id IS NOT NULL THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_id,
      related_type,
      action_url,
      metadata
    ) VALUES (
      project_owner_id,
      'waitlist_join',
      'New Waitlist Member',
      'Someone joined the waitlist for ' || project_record.name,
      NEW.project_id,
      'launchpad_project',
      '/launchpad/' || NEW.project_id,
      jsonb_build_object(
        'project_name', project_record.name,
        'total_waitlist', project_record.current_waitlist + 1
      )
    );
  END IF;

  -- Notify the user who joined
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_id,
    related_type,
    action_url,
    metadata
  ) VALUES (
    NEW.user_id,
    'waitlist_join',
    'Waitlist Confirmed',
    'You successfully joined the waitlist for ' || project_record.name,
    NEW.project_id,
    'launchpad_project',
    '/launchpad/' || NEW.project_id,
    jsonb_build_object(
      'project_name', project_record.name
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify when someone creates a P2P listing (sto_listings)
CREATE OR REPLACE FUNCTION notify_p2p_listing()
RETURNS TRIGGER AS $$
DECLARE
  asset_data JSONB;
  asset_name TEXT;
BEGIN
  -- Get asset details
  SELECT data INTO asset_data
  FROM user_requests
  WHERE id = NEW.asset_id;

  asset_name := COALESCE(asset_data->>'asset_name', 'Unknown Asset');

  -- Notify the seller that listing was created
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_id,
    related_type,
    action_url,
    metadata
  ) VALUES (
    NEW.seller_id,
    'p2p_bid',
    'Listing Created',
    'Your listing for ' || asset_name || ' is now active',
    NEW.id,
    'sto_listing',
    '/p2p-marketplace',
    jsonb_build_object(
      'price_per_share', NEW.price_per_share,
      'shares_for_sale', NEW.shares_for_sale,
      'asset_name', asset_name
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify when listing is sold
CREATE OR REPLACE FUNCTION notify_p2p_sale()
RETURNS TRIGGER AS $$
DECLARE
  asset_data JSONB;
  asset_name TEXT;
BEGIN
  -- Only trigger when status changes to 'sold'
  IF NEW.status = 'sold' AND OLD.status != 'sold' AND NEW.buyer_id IS NOT NULL THEN
    -- Get asset details
    SELECT data INTO asset_data
    FROM user_requests
    WHERE id = NEW.asset_id;

    asset_name := COALESCE(asset_data->>'asset_name', 'Unknown Asset');

    -- Notify seller
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_id,
      related_type,
      action_url,
      metadata
    ) VALUES (
      NEW.seller_id,
      'p2p_bid_accepted',
      'Listing Sold',
      'Your ' || asset_name || ' listing has been sold for €' || NEW.total_value,
      NEW.id,
      'sto_listing',
      '/p2p-marketplace',
      jsonb_build_object(
        'total_value', NEW.total_value,
        'shares_sold', NEW.shares_for_sale,
        'asset_name', asset_name,
        'buyer_id', NEW.buyer_id
      )
    );

    -- Notify buyer
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_id,
      related_type,
      action_url,
      metadata
    ) VALUES (
      NEW.buyer_id,
      'token_purchase',
      'Purchase Complete',
      'You successfully purchased ' || NEW.shares_for_sale || ' shares of ' || asset_name,
      NEW.id,
      'sto_listing',
      '/p2p-marketplace',
      jsonb_build_object(
        'total_value', NEW.total_value,
        'shares_purchased', NEW.shares_for_sale,
        'asset_name', asset_name
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify all users when a new launchpad project is launched
CREATE OR REPLACE FUNCTION notify_new_launchpad_project()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if status changes to 'active' or 'upcoming'
  IF NEW.status IN ('active', 'upcoming') AND (OLD.status IS NULL OR OLD.status NOT IN ('active', 'upcoming')) THEN
    -- Insert notification for all registered users
    INSERT INTO notifications (user_id, type, title, message, related_id, related_type, action_url, metadata)
    SELECT
      u.id,
      'new_project_launched',
      'New Project on Launchpad',
      NEW.name || ' is now available on the launchpad!',
      NEW.id,
      'launchpad_project',
      '/launchpad/' || NEW.id,
      jsonb_build_object(
        'project_name', NEW.name,
        'category', NEW.category,
        'token_standard', NEW.token_standard
      )
    FROM auth.users u
    WHERE u.id != NEW.created_by; -- Don't notify the creator
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify when support ticket gets a response
CREATE OR REPLACE FUNCTION notify_support_ticket_response()
RETURNS TRIGGER AS $$
DECLARE
  ticket_owner_id UUID;
  ticket_subject TEXT;
BEGIN
  -- Get ticket owner and subject
  SELECT user_id, subject
  INTO ticket_owner_id, ticket_subject
  FROM support_tickets
  WHERE id = NEW.ticket_id;

  -- Only notify if response is from admin (not from ticket owner themselves)
  IF NEW.user_id != ticket_owner_id THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_id,
      related_type,
      action_url,
      metadata
    ) VALUES (
      ticket_owner_id,
      'support_ticket_response',
      'New Support Response',
      'You have a new response to: ' || ticket_subject,
      NEW.ticket_id,
      'support_ticket',
      '/support/tickets/' || NEW.ticket_id,
      jsonb_build_object(
        'ticket_subject', ticket_subject
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify when tokens are purchased
CREATE OR REPLACE FUNCTION notify_token_purchase()
RETURNS TRIGGER AS $$
DECLARE
  project_record RECORD;
  seller_id UUID;
BEGIN
  -- Get project details
  SELECT p.*, p.created_by
  INTO project_record
  FROM launchpad_projects p
  WHERE p.id = NEW.project_id;

  seller_id := project_record.created_by;

  -- Notify project owner/seller
  IF seller_id IS NOT NULL AND seller_id != NEW.buyer_id THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_id,
      related_type,
      action_url,
      metadata
    ) VALUES (
      seller_id,
      'token_sale',
      'Tokens Sold!',
      NEW.amount || ' tokens sold from ' || project_record.name,
      NEW.project_id,
      'launchpad_project',
      '/launchpad/' || NEW.project_id,
      jsonb_build_object(
        'amount', NEW.amount,
        'price', NEW.price_per_token,
        'total', NEW.total_amount,
        'buyer_id', NEW.buyer_id,
        'project_name', project_record.name
      )
    );
  END IF;

  -- Notify buyer
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_id,
    related_type,
    action_url,
    metadata
  ) VALUES (
    NEW.buyer_id,
    'token_purchase',
    'Token Purchase Confirmed',
    'You purchased ' || NEW.amount || ' tokens of ' || project_record.name,
    NEW.project_id,
    'launchpad_project',
    '/wallet',
    jsonb_build_object(
      'amount', NEW.amount,
      'price', NEW.price_per_token,
      'total', NEW.total_amount,
      'project_name', project_record.name
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify when calendar entry is created
CREATE OR REPLACE FUNCTION notify_calendar_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify the user about their new calendar entry
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_id,
    related_type,
    action_url,
    metadata
  ) VALUES (
    NEW.user_id,
    'calendar_entry',
    'New Calendar Event',
    'New event: ' || NEW.title || ' on ' || TO_CHAR(NEW.start_time, 'Mon DD, YYYY'),
    NEW.id,
    'calendar_event',
    '/calendar',
    jsonb_build_object(
      'event_title', NEW.title,
      'start_time', NEW.start_time,
      'end_time', NEW.end_time,
      'service_type', NEW.service_type
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify admin when booking request is placed
CREATE OR REPLACE FUNCTION notify_request_placed()
RETURNS TRIGGER AS $$
DECLARE
  admin_ids UUID[];
BEGIN
  -- Get all admin user IDs (assuming there's an is_admin or role column)
  -- Adjust this query based on your admin identification system
  SELECT ARRAY_AGG(id) INTO admin_ids
  FROM auth.users
  WHERE raw_user_meta_data->>'role' = 'admin'
     OR raw_user_meta_data->>'is_admin' = 'true';

  -- Notify each admin
  IF admin_ids IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, related_id, related_type, action_url, metadata)
    SELECT
      admin_id,
      'request_placed',
      'New Booking Request',
      'New ' || COALESCE(NEW.request_type, 'service') || ' request from user',
      NEW.id,
      'booking_request',
      '/admin/requests/' || NEW.id,
      jsonb_build_object(
        'request_type', NEW.request_type,
        'origin', NEW.origin,
        'destination', NEW.destination,
        'passengers', NEW.passengers,
        'request_id', NEW.id,
        'user_id', NEW.user_id
      )
    FROM UNNEST(admin_ids) AS admin_id;
  END IF;

  -- Notify the user that their request was placed
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_id,
    related_type,
    action_url,
    metadata
  ) VALUES (
    NEW.user_id,
    'request_placed',
    'Booking Request Submitted',
    'Your ' || COALESCE(NEW.request_type, 'service') || ' request has been submitted and is being reviewed',
    NEW.id,
    'booking_request',
    '/requests/' || NEW.id,
    jsonb_build_object(
      'request_type', NEW.request_type,
      'request_id', NEW.id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify user when booking request is confirmed
CREATE OR REPLACE FUNCTION notify_request_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if status changes to 'confirmed'
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_id,
      related_type,
      action_url,
      metadata
    ) VALUES (
      NEW.user_id,
      'request_confirmed',
      'Booking Confirmed!',
      'Your ' || COALESCE(NEW.request_type, 'service') || ' booking has been confirmed',
      NEW.id,
      'booking_request',
      '/requests/' || NEW.id,
      jsonb_build_object(
        'request_type', NEW.request_type,
        'request_id', NEW.id,
        'status', NEW.status
      )
    );
  -- Notify if request is cancelled
  ELSIF NEW.status = 'cancelled' AND (OLD.status IS NULL OR OLD.status != 'cancelled') THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_id,
      related_type,
      action_url,
      metadata
    ) VALUES (
      NEW.user_id,
      'request_rejected',
      'Booking Cancelled',
      'Your ' || COALESCE(NEW.request_type, 'service') || ' booking has been cancelled',
      NEW.id,
      'booking_request',
      '/requests/' || NEW.id,
      jsonb_build_object(
        'request_type', NEW.request_type,
        'request_id', NEW.id,
        'status', NEW.status,
        'notes', NEW.notes
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CREATE TRIGGERS
-- =====================================================

-- Trigger for waitlist joins
CREATE TRIGGER trigger_notify_waitlist_join
  AFTER INSERT ON launchpad_waitlist
  FOR EACH ROW
  EXECUTE FUNCTION notify_waitlist_join();

-- Trigger for P2P listings (sto_listings)
CREATE TRIGGER trigger_notify_p2p_listing
  AFTER INSERT ON sto_listings
  FOR EACH ROW
  EXECUTE FUNCTION notify_p2p_listing();

-- Trigger for P2P sales (sto_listings)
CREATE TRIGGER trigger_notify_p2p_sale
  AFTER UPDATE ON sto_listings
  FOR EACH ROW
  EXECUTE FUNCTION notify_p2p_sale();

-- Trigger for new launchpad projects
CREATE TRIGGER trigger_notify_new_launchpad_project
  AFTER INSERT OR UPDATE ON launchpad_projects
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_launchpad_project();

-- Trigger for support ticket responses
CREATE TRIGGER trigger_notify_support_ticket_response
  AFTER INSERT ON support_ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_support_ticket_response();

-- Trigger for token purchases (if you have a transactions table)
CREATE TRIGGER trigger_notify_token_purchase
  AFTER INSERT ON launchpad_transactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_token_purchase();

-- Trigger for calendar entries
CREATE TRIGGER trigger_notify_calendar_entry
  AFTER INSERT ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION notify_calendar_entry();

-- Trigger for booking request placed
CREATE TRIGGER trigger_notify_request_placed
  AFTER INSERT ON booking_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_request_placed();

-- Trigger for booking request confirmed/cancelled
CREATE TRIGGER trigger_notify_request_confirmed
  AFTER UPDATE ON booking_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_request_confirmed();

-- =====================================================
-- ADMIN FUNCTIONS FOR PAYMENT LINKS
-- =====================================================

-- Function for admin to send payment link notification
CREATE OR REPLACE FUNCTION send_payment_link_notification(
  p_user_id UUID,
  p_request_id UUID,
  p_amount NUMERIC,
  p_currency TEXT,
  p_payment_url TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  -- Insert notification with payment link
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_id,
    related_type,
    action_url,
    metadata
  ) VALUES (
    p_user_id,
    'payment_link_sent',
    'Payment Link Received',
    COALESCE(p_description, 'Your payment link is ready. Click to proceed with payment.'),
    p_request_id,
    'payment',
    p_payment_url,
    jsonb_build_object(
      'amount', p_amount,
      'currency', p_currency,
      'payment_url', p_payment_url,
      'request_id', p_request_id
    )
  )
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission to use payment link function (for admins only)
GRANT EXECUTE ON FUNCTION send_payment_link_notification(UUID, UUID, NUMERIC, TEXT, TEXT, TEXT) TO authenticated;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET is_read = TRUE, read_at = NOW()
  WHERE id = notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET is_read = TRUE, read_at = NOW()
  WHERE user_id = auth.uid() AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete old read notifications (cleanup)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS VOID AS $$
BEGIN
  DELETE FROM notifications
  WHERE is_read = TRUE
  AND read_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, UPDATE ON notifications TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read() TO authenticated;
