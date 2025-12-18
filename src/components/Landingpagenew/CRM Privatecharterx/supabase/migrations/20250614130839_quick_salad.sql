/*
  # Add Deal Status to Partners Table

  1. Schema Changes
    - Add `deal_status` column to `partners` table
    - Set default value to 'new'
    - Add check constraint for valid status values
    - Create index for better query performance

  2. Security
    - No RLS changes needed as existing policies will apply to new column

  3. Data Migration
    - Set default status for existing partners
*/

-- Add deal_status column to partners table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'deal_status'
  ) THEN
    -- Add the deal_status column with default value 'new'
    ALTER TABLE partners ADD COLUMN deal_status text DEFAULT 'new';
    
    -- Add check constraint for valid status values
    ALTER TABLE partners ADD CONSTRAINT partners_deal_status_check 
      CHECK (deal_status IN ('new', 'contacted', 'zoom_call', 'contracting', 'closed'));
    
    -- Create index for better query performance
    CREATE INDEX idx_partners_deal_status ON partners(deal_status);
    
    -- Update existing partners to have a status
    UPDATE partners SET deal_status = 'new' WHERE deal_status IS NULL;
  END IF;
END $$;

-- Create a function to log partner deal status changes
CREATE OR REPLACE FUNCTION log_partner_deal_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if deal_status has changed
  IF OLD.deal_status IS DISTINCT FROM NEW.deal_status THEN
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
      'partner_deal_status_change',
      jsonb_build_object(
        'partner_id', NEW.id,
        'company_name', NEW.company_name,
        'old_status', OLD.deal_status,
        'new_status', NEW.deal_status
      ),
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for partner deal status changes
DROP TRIGGER IF EXISTS log_partner_deal_status_change_trigger ON partners;
CREATE TRIGGER log_partner_deal_status_change_trigger
  AFTER UPDATE OF deal_status ON partners
  FOR EACH ROW
  EXECUTE FUNCTION log_partner_deal_status_change();