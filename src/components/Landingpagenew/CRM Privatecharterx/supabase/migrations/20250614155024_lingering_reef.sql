-- Create storage_files table to track file metadata
CREATE TABLE IF NOT EXISTS storage_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  size bigint NOT NULL,
  path text NOT NULL,
  folder text NOT NULL,
  storage_path text NOT NULL,
  created_by uuid REFERENCES system_users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_public boolean DEFAULT false
);

-- Create storage_folders table to track folder structure
CREATE TABLE IF NOT EXISTS storage_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  path text NOT NULL UNIQUE,
  parent_folder text NOT NULL,
  created_by uuid REFERENCES system_users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on storage tables
ALTER TABLE storage_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_folders ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_storage_files_folder ON storage_files(folder);
CREATE INDEX IF NOT EXISTS idx_storage_files_created_by ON storage_files(created_by);
CREATE INDEX IF NOT EXISTS idx_storage_folders_parent_folder ON storage_folders(parent_folder);
CREATE INDEX IF NOT EXISTS idx_storage_folders_created_by ON storage_folders(created_by);

-- Create RLS policies for storage_files
CREATE POLICY "Everyone can read public files"
  ON storage_files
  FOR SELECT
  TO public
  USING (is_public = true);

CREATE POLICY "Authenticated users can read all files"
  ON storage_files
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can upload files"
  ON storage_files
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own files"
  ON storage_files
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can update all files"
  ON storage_files
  FOR UPDATE
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

CREATE POLICY "Users can delete their own files"
  ON storage_files
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Admins can delete all files"
  ON storage_files
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users 
      WHERE system_users.id = auth.uid() 
      AND system_users.role = 'admin'
    )
  );

-- Create RLS policies for storage_folders
CREATE POLICY "Authenticated users can read all folders"
  ON storage_folders
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create folders"
  ON storage_folders
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own folders"
  ON storage_folders
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can update all folders"
  ON storage_folders
  FOR UPDATE
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

CREATE POLICY "Users can delete their own folders"
  ON storage_folders
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Admins can delete all folders"
  ON storage_folders
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM system_users 
      WHERE system_users.id = auth.uid() 
      AND system_users.role = 'admin'
    )
  );

-- Create storage bucket for files if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('files', 'files', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for files bucket
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'files');

CREATE POLICY "Users can update their own files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can read all files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'files');

CREATE POLICY "Users can delete their own files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create default folders
INSERT INTO storage_folders (name, path, parent_folder, created_by)
VALUES 
  ('Documents', '/Documents', '', (SELECT id FROM system_users WHERE role = 'admin' LIMIT 1)),
  ('Images', '/Images', '', (SELECT id FROM system_users WHERE role = 'admin' LIMIT 1)),
  ('Contracts', '/Documents/Contracts', '/Documents', (SELECT id FROM system_users WHERE role = 'admin' LIMIT 1)),
  ('Marketing', '/Documents/Marketing', '/Documents', (SELECT id FROM system_users WHERE role = 'admin' LIMIT 1)),
  ('Aircraft', '/Images/Aircraft', '/Images', (SELECT id FROM system_users WHERE role = 'admin' LIMIT 1))
ON CONFLICT (path) DO NOTHING;

-- Create trigger to update updated_at column
CREATE TRIGGER update_storage_files_updated_at
  BEFORE UPDATE ON storage_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_storage_folders_updated_at
  BEFORE UPDATE ON storage_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();