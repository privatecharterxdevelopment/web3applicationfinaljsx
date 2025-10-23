-- Ensure calendar_events table has all required columns
-- This migration adds any missing columns without breaking existing ones

-- Add reminder_minutes column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='calendar_events' AND column_name='reminder_minutes') THEN
        ALTER TABLE calendar_events ADD COLUMN reminder_minutes INTEGER DEFAULT 60;
    END IF;
END $$;

-- Add chat_request_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='calendar_events' AND column_name='chat_request_id') THEN
        ALTER TABLE calendar_events ADD COLUMN chat_request_id UUID;
    END IF;
END $$;

-- Add booking_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='calendar_events' AND column_name='booking_id') THEN
        ALTER TABLE calendar_events ADD COLUMN booking_id UUID;
    END IF;
END $$;

-- Add event_type column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='calendar_events' AND column_name='event_type') THEN
        ALTER TABLE calendar_events ADD COLUMN event_type TEXT DEFAULT 'personal';
    END IF;
END $$;

-- Add color column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='calendar_events' AND column_name='color') THEN
        ALTER TABLE calendar_events ADD COLUMN color TEXT DEFAULT '#3B82F6';
    END IF;
END $$;

-- Add status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='calendar_events' AND column_name='status') THEN
        ALTER TABLE calendar_events ADD COLUMN status TEXT DEFAULT 'confirmed';
    END IF;
END $$;

-- Add meeting_link column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='calendar_events' AND column_name='meeting_link') THEN
        ALTER TABLE calendar_events ADD COLUMN meeting_link TEXT;
    END IF;
END $$;
