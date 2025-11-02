-- =====================================================
-- LAUNCHPAD ENHANCEMENTS - DATABASE MIGRATION
-- Adds smart contract address and accepted payment tokens
-- =====================================================

-- 1. Add new columns to launchpad_projects table
ALTER TABLE public.launchpad_projects
ADD COLUMN IF NOT EXISTS smart_contract_address TEXT,
ADD COLUMN IF NOT EXISTS accepted_tokens TEXT[] DEFAULT ARRAY['ETH', 'USDC', 'USDT'];

-- 2. Add comment for documentation
COMMENT ON COLUMN public.launchpad_projects.smart_contract_address IS 'Ethereum smart contract address for the token';
COMMENT ON COLUMN public.launchpad_projects.accepted_tokens IS 'Array of accepted payment token symbols (ETH, USDC, USDT)';

-- 3. Update existing projects to have default accepted tokens
UPDATE public.launchpad_projects
SET accepted_tokens = ARRAY['ETH', 'USDC', 'USDT']
WHERE accepted_tokens IS NULL;

-- 4. Update all existing projects to be STO type if not already set
UPDATE public.launchpad_projects
SET project_type = 'sto'
WHERE project_type IS NULL OR project_type = '';

-- 5. Add example smart contract addresses to existing projects (for testing)
-- Note: These are example addresses - replace with real contract addresses in production
UPDATE public.launchpad_projects
SET smart_contract_address = CONCAT('0x', md5(random()::text || clock_timestamp()::text))
WHERE smart_contract_address IS NULL;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Summary:
-- ✅ Added smart_contract_address column
-- ✅ Added accepted_tokens column (array of token symbols)
-- ✅ Set default accepted tokens for all projects (ETH, USDC, USDT)
-- ✅ Updated all existing projects to STO type
-- ✅ Added example smart contract addresses

-- Next Steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Update frontend to display smart contract and accepted tokens
-- 3. Replace example contract addresses with real ones when deploying to mainnet
