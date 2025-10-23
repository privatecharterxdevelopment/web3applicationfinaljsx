-- Run this SQL in Supabase Dashboard > SQL Editor to check migration status
-- This will tell you if the new columns exist or need to be added

SELECT
    'tokenization_drafts table status' AS check_type,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'tokenization_drafts'
            AND column_name = 'issuer_wallet_address'
        ) THEN '✅ Migration already applied'
        ELSE '❌ Migration needed - columns do not exist'
    END AS status;

-- List all columns in tokenization_drafts table
SELECT
    'Current columns' AS info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'tokenization_drafts'
ORDER BY ordinal_position;

-- Check for new indexes
SELECT
    'Index status' AS check_type,
    indexname,
    CASE
        WHEN indexname IS NOT NULL THEN '✅ Exists'
        ELSE '❌ Missing'
    END AS status
FROM pg_indexes
WHERE tablename = 'tokenization_drafts'
AND indexname IN (
    'idx_tokenization_drafts_issuer_wallet',
    'idx_tokenization_drafts_status_approved',
    'idx_tokenization_drafts_launch_date'
)
UNION ALL
SELECT
    'Index status' AS check_type,
    expected_index AS indexname,
    '❌ Missing' AS status
FROM (
    VALUES
        ('idx_tokenization_drafts_issuer_wallet'),
        ('idx_tokenization_drafts_status_approved'),
        ('idx_tokenization_drafts_launch_date')
) AS expected(expected_index)
WHERE NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE tablename = 'tokenization_drafts'
    AND indexname = expected_index
);
