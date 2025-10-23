-- Fix RLS policy for face_authentication during registration
-- The issue: Users can't insert their face data during registration because they're not authenticated yet

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can insert own face auth" ON public.face_authentication;

-- Create a new policy that allows inserts during registration
-- This checks if the user_id exists in the users table (meaning it's a valid registration)
CREATE POLICY "Users can insert face auth during registration"
  ON public.face_authentication
  FOR INSERT
  WITH CHECK (
    -- Allow if authenticated user matches
    auth.uid() = user_id
    OR
    -- Allow if user exists in users table (for registration flow)
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = user_id
    )
  );

-- Also ensure the update policy allows upserts
DROP POLICY IF EXISTS "Users can update own face auth" ON public.face_authentication;

CREATE POLICY "Users can update own face auth"
  ON public.face_authentication
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = user_id
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = user_id
    )
  );

-- Grant necessary permissions
GRANT INSERT, UPDATE ON public.face_authentication TO anon;
GRANT INSERT, UPDATE ON public.face_authentication TO authenticated;
