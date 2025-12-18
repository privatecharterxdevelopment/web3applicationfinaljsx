/*
  # Add Client Status Field

  1. Schema Changes
    - Add `status` column to `clients` table
    - Set default value to 'new'
    - Add check constraint for valid status values
    - Create index for better query performance

  2. Security
    - No RLS changes needed as existing policies will apply to new column

  3. Data Migration
    - Set default status for existing clients
*/

-- Add status column to clients table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'status'
  ) THEN
    -- Add the status column with default value 'new'
    ALTER TABLE clients ADD COLUMN status text DEFAULT 'new';
    
    -- Add check constraint for valid status values
    ALTER TABLE clients ADD CONSTRAINT clients_status_check 
      CHECK (status IN ('new', 'contacted', 'zoom_call', 'contracting', 'closed'));
    
    -- Create index for better query performance
    CREATE INDEX idx_clients_status ON clients(status);
    
    -- Update existing clients to have a status
    UPDATE clients SET status = 'new' WHERE status IS NULL;
  END IF;
END $$;

-- Create a function to log client status changes
CREATE OR REPLACE FUNCTION log_client_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status has changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO user_activity_logs (
      user_id,
      action,
      details,
      created_at
    ) VALUES (
      COALESCE(
        (SELECT id FROM system_users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'),
        NULL
      ),
      'client_status_change',
      jsonb_build_object(
        'client_id', NEW.id,
        'client_name', NEW.name,
        'old_status', OLD.status,
        'new_status', NEW.status
      ),
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for client status changes
DROP TRIGGER IF EXISTS log_client_status_change_trigger ON clients;
CREATE TRIGGER log_client_status_change_trigger
  AFTER UPDATE OF status ON clients
  FOR EACH ROW
  EXECUTE FUNCTION log_client_status_change();