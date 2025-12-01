-- Create support_requests table for the report/support popup feature
-- Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard)

-- Create the support_requests table
CREATE TABLE IF NOT EXISTS support_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  admin_notes TEXT
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_support_requests_user_id ON support_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_support_requests_status ON support_requests(status);
CREATE INDEX IF NOT EXISTS idx_support_requests_created_at ON support_requests(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own support requests
CREATE POLICY "Users can create support requests" ON support_requests
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can view their own support requests
CREATE POLICY "Users can view own support requests" ON support_requests
  FOR SELECT
  USING (auth.uid() = user_id OR user_email = auth.email());

-- Policy: Admins can view all support requests (add your admin user IDs)
-- Note: Uncomment and modify this if you have admin users
-- CREATE POLICY "Admins can view all support requests" ON support_requests
--   FOR ALL
--   USING (auth.uid() IN ('admin-user-id-1', 'admin-user-id-2'));

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_support_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_support_requests_updated_at
  BEFORE UPDATE ON support_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_support_requests_updated_at();

-- Grant permissions to authenticated users
GRANT INSERT, SELECT ON support_requests TO authenticated;
GRANT SELECT ON support_requests TO anon;
