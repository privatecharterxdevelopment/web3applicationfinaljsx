/*
  # Create user requests table

  1. New Tables
    - `user_requests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `type` (text)
      - `status` (text)
      - `data` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `completed_at` (timestamptz)
      - `admin_notes` (text)
      - `admin_id` (uuid, references auth.users)

  2. Security
    - Enable RLS
    - Add policies for user access
    - Add policies for admin access
    - Use auth.users for admin check
*/

-- Create user_requests table
CREATE TABLE user_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  admin_notes text,
  admin_id uuid REFERENCES auth.users,

  -- Add constraint for valid status values
  CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),

  -- Add constraint for valid request types
  CONSTRAINT valid_type CHECK (type IN (
    'flight_quote',
    'support',
    'document',
    'visa',
    'payment',
    'booking',
    'cancellation',
    'modification'
  ))
);

-- Enable RLS
ALTER TABLE user_requests ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_user_requests_user_id ON user_requests(user_id);
CREATE INDEX idx_user_requests_type ON user_requests(type);
CREATE INDEX idx_user_requests_status ON user_requests(status);
CREATE INDEX idx_user_requests_created_at ON user_requests(created_at);

-- Create policies
-- Users can view their own requests
CREATE POLICY "Users can view own requests"
  ON user_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create requests
CREATE POLICY "Users can create requests"
  ON user_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their pending requests
CREATE POLICY "Users can update own pending requests"
  ON user_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Admins have full access (using auth.users metadata)
CREATE POLICY "Admins have full access"
  ON user_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'is_admin' = 'true'
    )
  );