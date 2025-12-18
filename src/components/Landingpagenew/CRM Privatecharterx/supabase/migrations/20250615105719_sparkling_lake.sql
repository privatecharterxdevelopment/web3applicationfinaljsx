/*
  # Fix Storage RLS Policies

  1. Security Updates
    - Fix RLS policies for storage_files table
    - Ensure proper access control for file operations
    - Fix auth.jwt() references to use current_setting instead

  2. Changes
    - Drop problematic policies
    - Create new policies with proper syntax
    - Fix user identification in policies
*/

-- Enable RLS on storage_files table (if not already enabled)
ALTER TABLE storage_files ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage_files;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage_files;
DROP POLICY IF EXISTS "Users can update their own files" ON storage_files;
DROP POLICY IF EXISTS "Authenticated users can read all files" ON storage_files;
DROP POLICY IF EXISTS "Everyone can read public files" ON storage_files;
DROP POLICY IF EXISTS "Admins can update all files" ON storage_files;
DROP POLICY IF EXISTS "Admins can delete all files" ON storage_files;

-- Create function to get current user email from JWT claims
CREATE OR REPLACE FUNCTION get_current_user_email()
RETURNS text AS $$
BEGIN
  RETURN COALESCE(
    (current_setting('request.jwt.claims', true)::json ->> 'email'),
    ''
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new policies for storage_files table
CREATE POLICY "storage_files_insert_policy" ON storage_files
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Users can only insert files where they are the creator
    created_by = auth.uid()
  );

CREATE POLICY "storage_files_select_policy" ON storage_files
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "storage_files_update_policy" ON storage_files
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "storage_files_delete_policy" ON storage_files
  FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- Admin policies for storage_files
CREATE POLICY "storage_files_admin_all" ON storage_files
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users 
      WHERE email = get_current_user_email()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM system_users 
      WHERE email = get_current_user_email()
      AND role = 'admin'
    )
  );

-- Public read policy for public files
CREATE POLICY "storage_files_public_read" ON storage_files
  FOR SELECT TO public
  USING (is_public = true);

-- Note: Storage bucket policies must be created through the Supabase dashboard
-- or via the Supabase API, not through SQL migrations.
-- The following comment describes what needs to be done manually:

/*
Storage bucket policies to be created via Supabase dashboard:

1. For the 'files' bucket:
   - INSERT policy: Allow authenticated users to upload files
     - Definition: bucket_id = 'files'
   
   - SELECT policy: Allow authenticated users to read all files
     - Definition: bucket_id = 'files'
   
   - UPDATE policy: Allow users to update their own files
     - Definition: bucket_id = 'files' AND auth.uid()::text = (storage.foldername(name))[1]
   
   - DELETE policy: Allow users to delete their own files
     - Definition: bucket_id = 'files' AND auth.uid()::text = (storage.foldername(name))[1]
*/