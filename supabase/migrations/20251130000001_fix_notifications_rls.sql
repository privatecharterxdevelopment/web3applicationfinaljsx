-- Fix notifications table RLS policies
-- Run this in your Supabase SQL Editor if notifications table has permission issues

-- Enable RLS on notifications if not already enabled
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

-- Recreate policies with proper permissions
-- Users can read their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read, etc.)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- System/service role can insert notifications for any user
-- This allows triggers and edge functions to insert notifications
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Grant proper permissions to authenticated users
GRANT SELECT, UPDATE, DELETE ON notifications TO authenticated;

-- Verify the policies are created
SELECT * FROM pg_policies WHERE tablename = 'notifications';
