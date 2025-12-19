-- Convert departure_date column from text (MM/DD/YYYY) to proper date type
-- This migration is now a no-op because the column is already DATE type
-- Original: ALTER TABLE "EmptyLegs_" ALTER COLUMN departure_date TYPE DATE USING TO_DATE(departure_date, 'MM/DD/YYYY');

DO $$
BEGIN
    -- Only convert if the column is still text type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'EmptyLegs_'
        AND column_name = 'departure_date'
        AND data_type = 'text'
    ) THEN
        ALTER TABLE "EmptyLegs_" ALTER COLUMN departure_date TYPE DATE USING TO_DATE(departure_date, 'MM/DD/YYYY');
        RAISE NOTICE 'Converted departure_date from text to date';
    ELSE
        RAISE NOTICE 'departure_date is already date type, skipping conversion';
    END IF;
END $$;
