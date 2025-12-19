-- Add NFT-related request types to user_requests table constraint
-- This allows for nft_discount_empty_leg and nft_free_flight request types

DO $$
BEGIN
    -- Drop the existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'user_requests'
        AND constraint_name = 'valid_type'
    ) THEN
        ALTER TABLE user_requests DROP CONSTRAINT valid_type;
    END IF;

    -- Update any rows with invalid type values to a default valid type
    -- This handles cases where there might be unexpected type values
    UPDATE user_requests
    SET type = 'support'
    WHERE type IS NULL OR type NOT IN (
        'flight_quote',
        'support',
        'document',
        'visa',
        'payment',
        'booking',
        'cancellation',
        'modification',
        'private_jet_charter',
        'fixed_offer',
        'helicopter_charter',
        'empty_leg',
        'luxury_car_rental',
        'nft_discount_empty_leg',
        'nft_free_flight'
    );

    -- Add the new constraint with NFT request types included
    ALTER TABLE user_requests ADD CONSTRAINT valid_type CHECK (
        type = ANY (ARRAY[
            'flight_quote'::text,
            'support'::text,
            'document'::text,
            'visa'::text,
            'payment'::text,
            'booking'::text,
            'cancellation'::text,
            'modification'::text,
            'private_jet_charter'::text,
            'fixed_offer'::text,
            'helicopter_charter'::text,
            'empty_leg'::text,
            'luxury_car_rental'::text,
            'nft_discount_empty_leg'::text,
            'nft_free_flight'::text
        ])
    );

    RAISE NOTICE 'Successfully updated valid_type constraint with NFT request types';
END $$;