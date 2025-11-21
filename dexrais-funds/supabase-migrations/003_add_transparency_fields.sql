-- Add transparency and company information fields to campaigns table

DO $$
BEGIN
  -- Company & Organization Information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='campaigns' AND column_name='company_name') THEN
    ALTER TABLE campaigns ADD COLUMN company_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='campaigns' AND column_name='company_description') THEN
    ALTER TABLE campaigns ADD COLUMN company_description TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='campaigns' AND column_name='company_location') THEN
    ALTER TABLE campaigns ADD COLUMN company_location TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='campaigns' AND column_name='company_website') THEN
    ALTER TABLE campaigns ADD COLUMN company_website TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='campaigns' AND column_name='company_registration') THEN
    ALTER TABLE campaigns ADD COLUMN company_registration TEXT; -- Registration number/incorporation details
  END IF;

  -- DAO/Project Information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='campaigns' AND column_name='dao_purpose') THEN
    ALTER TABLE campaigns ADD COLUMN dao_purpose TEXT; -- Clear purpose/mission of the DAO
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='campaigns' AND column_name='dao_governance') THEN
    ALTER TABLE campaigns ADD COLUMN dao_governance TEXT; -- How the DAO is governed
  END IF;

  -- Benefits & Utility
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='campaigns' AND column_name='contributor_benefits') THEN
    ALTER TABLE campaigns ADD COLUMN contributor_benefits TEXT; -- What contributors receive
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='campaigns' AND column_name='utility_type') THEN
    ALTER TABLE campaigns ADD COLUMN utility_type TEXT; -- 'token', 'nft', 'rwa', 'governance', 'revenue_share', etc.
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='campaigns' AND column_name='token_details') THEN
    ALTER TABLE campaigns ADD COLUMN token_details JSONB; -- Token economics, distribution, vesting
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='campaigns' AND column_name='rwa_details') THEN
    ALTER TABLE campaigns ADD COLUMN rwa_details JSONB; -- Real World Asset details if applicable
  END IF;

  -- Risk & Transparency
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='campaigns' AND column_name='risk_factors') THEN
    ALTER TABLE campaigns ADD COLUMN risk_factors TEXT; -- Clear disclosure of risks
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='campaigns' AND column_name='legal_structure') THEN
    ALTER TABLE campaigns ADD COLUMN legal_structure TEXT; -- Legal entity type and jurisdiction
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='campaigns' AND column_name='audit_report_url') THEN
    ALTER TABLE campaigns ADD COLUMN audit_report_url TEXT; -- Link to audit reports
  END IF;

  -- Team Information (expanded from campaign_team table)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='campaigns' AND column_name='team_description') THEN
    ALTER TABLE campaigns ADD COLUMN team_description TEXT; -- Overview of the team
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='campaigns' AND column_name='team_linkedin') THEN
    ALTER TABLE campaigns ADD COLUMN team_linkedin TEXT; -- Company/team LinkedIn
  END IF;

  -- Social & Communication
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='campaigns' AND column_name='telegram_url') THEN
    ALTER TABLE campaigns ADD COLUMN telegram_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='campaigns' AND column_name='medium_url') THEN
    ALTER TABLE campaigns ADD COLUMN medium_url TEXT;
  END IF;

  -- Use of Funds
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='campaigns' AND column_name='funds_allocation') THEN
    ALTER TABLE campaigns ADD COLUMN funds_allocation JSONB; -- Breakdown of how funds will be used
  END IF;

  -- Timeline & Roadmap
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='campaigns' AND column_name='roadmap') THEN
    ALTER TABLE campaigns ADD COLUMN roadmap JSONB; -- Project roadmap/timeline
  END IF;

END $$;

-- Add comment to document the new fields
COMMENT ON COLUMN campaigns.company_name IS 'Legal name of the company/organization';
COMMENT ON COLUMN campaigns.dao_purpose IS 'Clear statement of the DAO''s purpose and mission';
COMMENT ON COLUMN campaigns.contributor_benefits IS 'Description of what contributors receive';
COMMENT ON COLUMN campaigns.utility_type IS 'Type of utility: token, nft, rwa, governance, revenue_share, etc.';
COMMENT ON COLUMN campaigns.risk_factors IS 'Disclosed risks for potential contributors';
COMMENT ON COLUMN campaigns.legal_structure IS 'Legal entity structure and jurisdiction';
COMMENT ON COLUMN campaigns.funds_allocation IS 'JSON breakdown of fund usage';
