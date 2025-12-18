/*
  # Fix Calendar Events RLS Policies - Type Corrected

  1. Security Updates
    - Drop existing problematic policies
    - Create new RLS policies with proper type casting
    - Fix uuid/text type mismatch in attendees array comparison

  2. Changes
    - Allow authenticated users to create calendar events
    - Allow users to read events they created, are invited to, or all events for admins
    - Allow users to update/delete their own events or admins to manage all
    - Add public read access for basic calendar viewing
*/

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Admins can manage all calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can create calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can read all calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can update own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can delete own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Public can read calendar events" ON calendar_events;

-- Create comprehensive RLS policies for calendar_events

-- Allow authenticated users to insert events if they set themselves as the creator
CREATE POLICY "Users can create calendar events"
  ON calendar_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Allow users to read events they created, are invited to, or all events for admins
CREATE POLICY "Users can read calendar events"
  ON calendar_events
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = created_by OR 
    auth.uid()::text = ANY(attendees) OR
    EXISTS (
      SELECT 1 FROM system_users 
      WHERE system_users.id = auth.uid() 
      AND system_users.role = 'admin'
    )
  );

-- Allow users to update their own events or admins to update any
CREATE POLICY "Users can update own calendar events"
  ON calendar_events
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM system_users 
      WHERE system_users.id = auth.uid() 
      AND system_users.role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM system_users 
      WHERE system_users.id = auth.uid() 
      AND system_users.role = 'admin'
    )
  );

-- Allow users to delete their own events or admins to delete any
CREATE POLICY "Users can delete own calendar events"
  ON calendar_events
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM system_users 
      WHERE system_users.id = auth.uid() 
      AND system_users.role = 'admin'
    )
  );

-- Also allow public read access for basic calendar viewing
CREATE POLICY "Public can read calendar events"
  ON calendar_events
  FOR SELECT
  TO public
  USING (true);