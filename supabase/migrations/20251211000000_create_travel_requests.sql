-- Migration: Create Travel Requests Table for Luxury Travel Planning
-- Date: 2025-12-11
-- Description: Stores luxury travel itineraries created by AI with minimum $20,000 budget

-- Create travel_requests table
CREATE TABLE IF NOT EXISTS travel_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    request_id VARCHAR(50) UNIQUE NOT NULL,

    -- Trip Details
    destination VARCHAR(255) NOT NULL,
    departure_location VARCHAR(255),
    departure_date DATE NOT NULL,
    return_date DATE NOT NULL,
    adults INTEGER NOT NULL DEFAULT 2,
    children INTEGER DEFAULT 0,

    -- Budget (Minimum $20,000 enforced)
    total_budget DECIMAL(12,2) NOT NULL CHECK (total_budget >= 20000),
    estimated_cost DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'USD',

    -- Budget Breakdown (JSONB)
    budget_breakdown JSONB DEFAULT '{}'::jsonb,
    -- Example: {"accommodation": 15000, "transportation": 12000, "dining": 5000, "activities": 8000}

    -- Full Itinerary (JSONB)
    itinerary_data JSONB DEFAULT '{}'::jsonb,
    -- Structure: {"days": [{"day": 1, "date": "2025-06-15", "activities": [...]}]}

    -- Maps Data (JSONB)
    maps_data JSONB DEFAULT '{}'::jsonb,
    -- Structure: {"overview_map_url": "...", "daily_routes": [...], "center": {lat, lng}}

    -- Verified Venues (JSONB array)
    verified_venues JSONB DEFAULT '[]'::jsonb,
    -- Array of verified Google Places with place_id, name, address, coordinates

    -- Status Tracking
    status VARCHAR(50) DEFAULT 'pending_review',
    -- Values: draft, pending_review, confirmed, in_progress, completed, cancelled

    -- Contact Information
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    special_requests TEXT,

    -- Admin Processing
    admin_notes TEXT,
    processed_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_travel_requests_user_id ON travel_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_requests_request_id ON travel_requests(request_id);
CREATE INDEX IF NOT EXISTS idx_travel_requests_status ON travel_requests(status);
CREATE INDEX IF NOT EXISTS idx_travel_requests_destination ON travel_requests(destination);
CREATE INDEX IF NOT EXISTS idx_travel_requests_created_at ON travel_requests(created_at DESC);

-- Enable RLS
ALTER TABLE travel_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own travel requests
CREATE POLICY "Users can view own travel requests"
    ON travel_requests
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own travel requests
CREATE POLICY "Users can insert own travel requests"
    ON travel_requests
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending travel requests
CREATE POLICY "Users can update own pending travel requests"
    ON travel_requests
    FOR UPDATE
    USING (auth.uid() = user_id AND status IN ('draft', 'pending_review'));

-- Admins can view all travel requests
CREATE POLICY "Admins can view all travel requests"
    ON travel_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_settings
            WHERE user_id = auth.uid()
        )
    );

-- Admins can update all travel requests
CREATE POLICY "Admins can update all travel requests"
    ON travel_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM admin_settings
            WHERE user_id = auth.uid()
        )
    );

-- Admins can insert travel requests for any user
CREATE POLICY "Admins can insert travel requests"
    ON travel_requests
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_settings
            WHERE user_id = auth.uid()
        )
    );

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_travel_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_travel_requests_updated_at ON travel_requests;
CREATE TRIGGER trigger_travel_requests_updated_at
    BEFORE UPDATE ON travel_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_travel_requests_updated_at();

-- Function to generate unique request ID
CREATE OR REPLACE FUNCTION generate_travel_request_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.request_id IS NULL THEN
        NEW.request_id := 'TRAVEL-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate request_id
DROP TRIGGER IF EXISTS trigger_generate_travel_request_id ON travel_requests;
CREATE TRIGGER trigger_generate_travel_request_id
    BEFORE INSERT ON travel_requests
    FOR EACH ROW
    EXECUTE FUNCTION generate_travel_request_id();

-- Add travel_request type to user_requests constraint if not exists
-- This allows us to also store a reference in user_requests for unified admin view
DO $$
BEGIN
    -- Just ensure the type can be used (TEXT column accepts any string)
    RAISE NOTICE 'travel_request type can be used in user_requests table';
END $$;

-- Comment on table
COMMENT ON TABLE travel_requests IS 'Stores luxury travel planning requests with minimum $20,000 budget. Contains full itineraries, verified venues, and maps data.';
