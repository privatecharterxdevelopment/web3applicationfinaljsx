/*
  # Fix Calendar Events RLS Policies

  1. Security Updates
    - Add INSERT policy for authenticated users to create calendar events
    - Add UPDATE policy for users to modify their own events
    - Add DELETE policy for users to delete their own events
    - Add SELECT policy for users to read calendar events

  This migration fixes the RLS policy violation error when creating calendar events.
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can read all calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can update own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can delete own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Admins can manage all calendar events" ON calendar_events;

-- Create comprehensive RLS policies for calendar_events table

-- Allow authenticated users to create calendar events
CREATE POLICY "Users can create calendar events"
  ON calendar_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Allow users to read all calendar events (for team collaboration)
CREATE POLICY "Users can read all calendar events"
  ON calendar_events
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to update their own calendar events
CREATE POLICY "Users can update own calendar events"
  ON calendar_events
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Allow users to delete their own calendar events
CREATE POLICY "Users can delete own calendar events"
  ON calendar_events
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Allow admins to manage all calendar events
CREATE POLICY "Admins can manage all calendar events"
  ON calendar_events
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users 
      WHERE system_users.id = auth.uid() 
      AND system_users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users 
      WHERE system_users.id = auth.uid() 
      AND system_users.role = 'admin'
    )
  );