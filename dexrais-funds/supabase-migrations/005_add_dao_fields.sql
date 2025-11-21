-- Add Aragon DAO fields to campaigns table
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS dao_address TEXT,
ADD COLUMN IF NOT EXISTS dao_name TEXT,
ADD COLUMN IF NOT EXISTS dao_metadata JSONB,
ADD COLUMN IF NOT EXISTS dao_treasury_address TEXT,
ADD COLUMN IF NOT EXISTS dao_voting_plugin_address TEXT,
ADD COLUMN IF NOT EXISTS dao_created_at TIMESTAMP WITH TIME ZONE;

-- Add index for DAO address lookups
CREATE INDEX IF NOT EXISTS idx_campaigns_dao_address ON campaigns(dao_address);

-- Add comment explaining the fields
COMMENT ON COLUMN campaigns.dao_address IS 'Aragon DAO contract address for campaign governance';
COMMENT ON COLUMN campaigns.dao_name IS 'Human-readable name of the DAO';
COMMENT ON COLUMN campaigns.dao_metadata IS 'Additional DAO configuration and metadata';
COMMENT ON COLUMN campaigns.dao_treasury_address IS 'DAO treasury/vault address for holding funds';
COMMENT ON COLUMN campaigns.dao_voting_plugin_address IS 'Voting plugin address for governance decisions';
