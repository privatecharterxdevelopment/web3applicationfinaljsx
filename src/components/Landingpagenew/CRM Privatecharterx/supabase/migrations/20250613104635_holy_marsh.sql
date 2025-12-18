/*
  # Calendar System with Notifications

  1. New Tables
    - `notifications` - Store user notifications
    - Update `calendar_events` to include client_id

  2. Security
    - Enable RLS on notifications table
    - Add policies for notification access

  3. Changes
    - Add client_id column to calendar_events
    - Create notification system for calendar events
*/

-- Add client_id to calendar_events if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_events' AND column_name = 'client_id'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN client_id uuid REFERENCES clients(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES system_users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  data jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- RLS policies for notifications
CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  TO public
  USING (
    user_id = get_current_user_id(
      (current_setting('request.jwt.claims', true)::json ->> 'email')
    )
  );

CREATE POLICY "System can create notifications"
  ON notifications
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO public
  USING (
    user_id = get_current_user_id(
      (current_setting('request.jwt.claims', true)::json ->> 'email')
    )
  )
  WITH CHECK (
    user_id = get_current_user_id(
      (current_setting('request.jwt.claims', true)::json ->> 'email')
    )
  );

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE notifications 
  SET is_read = true, read_at = now()
  WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;