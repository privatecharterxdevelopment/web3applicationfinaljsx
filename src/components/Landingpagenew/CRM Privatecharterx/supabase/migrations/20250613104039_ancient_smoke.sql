/*
  # Create calendar events table

  1. New Tables
    - `calendar_events`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text, optional)
      - `start_date` (date, required)
      - `end_date` (date, required)
      - `start_time` (time, optional)
      - `end_time` (time, optional)
      - `location` (text, optional)
      - `event_type` (text, required with constraints)
      - `created_by` (uuid, foreign key to system_users)
      - `attendees` (text array)
      - `is_all_day` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `calendar_events` table
    - Add policies for authenticated users to manage events
    - Add admin policies for full access

  3. Indexes
    - Index on start_date for date range queries
    - Index on created_by for user filtering
    - Index on event_type for filtering
*/

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  start_time time,
  end_time time,
  location text,
  event_type text NOT NULL CHECK (event_type IN ('meeting', 'call', 'appointment', 'reminder', 'other')),
  created_by uuid NOT NULL REFERENCES system_users(id) ON DELETE CASCADE,
  attendees text[] DEFAULT '{}',
  is_all_day boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON calendar_events(created_by);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_type ON calendar_events(event_type);

-- Create helper function to get current user ID from email
CREATE OR REPLACE FUNCTION get_current_user_id(user_email text)
RETURNS uuid AS $$
BEGIN
  RETURN (
    SELECT id FROM system_users 
    WHERE email = user_email 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_email text)
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role = 'admin' 
    FROM system_users 
    WHERE email = user_email 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies using email-based authentication
CREATE POLICY "Users can read all calendar events"
  ON calendar_events
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create calendar events"
  ON calendar_events
  FOR INSERT
  TO public
  WITH CHECK (
    created_by = get_current_user_id(
      (current_setting('request.jwt.claims', true)::json ->> 'email')
    )
  );

CREATE POLICY "Users can update own calendar events"
  ON calendar_events
  FOR UPDATE
  TO public
  USING (
    created_by = get_current_user_id(
      (current_setting('request.jwt.claims', true)::json ->> 'email')
    )
  )
  WITH CHECK (
    created_by = get_current_user_id(
      (current_setting('request.jwt.claims', true)::json ->> 'email')
    )
  );

CREATE POLICY "Users can delete own calendar events"
  ON calendar_events
  FOR DELETE
  TO public
  USING (
    created_by = get_current_user_id(
      (current_setting('request.jwt.claims', true)::json ->> 'email')
    )
  );

CREATE POLICY "Admins can manage all calendar events"
  ON calendar_events
  FOR ALL
  TO public
  USING (
    is_admin((current_setting('request.jwt.claims', true)::json ->> 'email'))
  )
  WITH CHECK (
    is_admin((current_setting('request.jwt.claims', true)::json ->> 'email'))
  );

-- Create trigger function to update updated_at column
CREATE OR REPLACE FUNCTION update_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_events_updated_at();