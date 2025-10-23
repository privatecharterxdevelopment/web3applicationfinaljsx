-- ============================================
-- CALENDAR SYSTEM - Complete Database Schema
-- ============================================

-- 1. Calendar Events Table
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Event Details
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT CHECK (event_type IN ('flight', 'booking', 'meeting', 'personal', 'travel', 'other')),

    -- Date/Time
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    all_day BOOLEAN DEFAULT FALSE,
    timezone TEXT DEFAULT 'UTC',

    -- Location
    location TEXT,
    meeting_link TEXT,

    -- Status
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),

    -- Linked Resources
    booking_id UUID, -- Link to actual booking
    chat_request_id UUID REFERENCES chat_requests(id) ON DELETE SET NULL,

    -- Google Calendar Integration
    google_event_id TEXT,
    google_calendar_id TEXT,
    synced_to_google BOOLEAN DEFAULT FALSE,
    last_synced_at TIMESTAMPTZ,

    -- Visibility & Privacy
    visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'shared')),

    -- Recurrence
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_rule TEXT, -- iCal RRULE format
    recurrence_end_date TIMESTAMPTZ,

    -- Color coding
    color TEXT DEFAULT '#3B82F6',

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),

    -- Reminders
    reminder_minutes INTEGER DEFAULT 60,
    reminder_sent BOOLEAN DEFAULT FALSE
);

-- 2. Event Attendees Table
CREATE TABLE IF NOT EXISTS event_attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Attendee Details
    email TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'attendee' CHECK (role IN ('organizer', 'attendee', 'optional')),

    -- Response Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'tentative')),
    responded_at TIMESTAMPTZ,

    -- Notifications
    notify_on_update BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(event_id, user_id)
);

-- 3. Google Calendar Connections Table
CREATE TABLE IF NOT EXISTS google_calendar_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

    -- OAuth Tokens
    google_access_token TEXT NOT NULL,
    google_refresh_token TEXT NOT NULL,
    token_expires_at TIMESTAMPTZ NOT NULL,

    -- Calendar Info
    google_email TEXT NOT NULL,
    primary_calendar_id TEXT,

    -- Sync Settings
    sync_enabled BOOLEAN DEFAULT TRUE,
    sync_direction TEXT DEFAULT 'both' CHECK (sync_direction IN ('to_google', 'from_google', 'both')),
    last_sync_at TIMESTAMPTZ,
    sync_interval INTEGER DEFAULT 15, -- minutes

    -- Connected
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Event Activity Log
CREATE TABLE IF NOT EXISTS event_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    action TEXT NOT NULL, -- created, updated, cancelled, rescheduled, etc.
    details JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES for Performance
-- ============================================

-- Calendar Events Indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_end_date ON calendar_events(end_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_type ON calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_chat_request ON calendar_events(chat_request_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_google_event ON calendar_events(google_event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date_range ON calendar_events(user_id, start_date, end_date);

-- Event Attendees Indexes
CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user_id ON event_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_email ON event_attendees(email);
CREATE INDEX IF NOT EXISTS idx_event_attendees_status ON event_attendees(status);

-- Google Calendar Connections Indexes
CREATE INDEX IF NOT EXISTS idx_google_calendar_user_id ON google_calendar_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_google_calendar_sync_enabled ON google_calendar_connections(sync_enabled);

-- Event Activity Log Indexes
CREATE INDEX IF NOT EXISTS idx_event_activity_event_id ON event_activity_log(event_id);
CREATE INDEX IF NOT EXISTS idx_event_activity_created_at ON event_activity_log(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_activity_log ENABLE ROW LEVEL SECURITY;

-- Calendar Events Policies
CREATE POLICY "Users can view their own events"
    ON calendar_events FOR SELECT
    USING (
        auth.uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM event_attendees
            WHERE event_attendees.event_id = calendar_events.id
            AND event_attendees.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create events"
    ON calendar_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events"
    ON calendar_events FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events"
    ON calendar_events FOR DELETE
    USING (auth.uid() = user_id);

-- Event Attendees Policies
CREATE POLICY "Users can view attendees of their events"
    ON event_attendees FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM calendar_events
            WHERE calendar_events.id = event_attendees.event_id
            AND (calendar_events.user_id = auth.uid() OR event_attendees.user_id = auth.uid())
        )
    );

CREATE POLICY "Event organizers can manage attendees"
    ON event_attendees FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM calendar_events
            WHERE calendar_events.id = event_attendees.event_id
            AND calendar_events.user_id = auth.uid()
        )
    );

CREATE POLICY "Attendees can update their own status"
    ON event_attendees FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Google Calendar Connections Policies
CREATE POLICY "Users can view their own Google connection"
    ON google_calendar_connections FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own Google connection"
    ON google_calendar_connections FOR ALL
    USING (auth.uid() = user_id);

-- Event Activity Log Policies
CREATE POLICY "Users can view activity of their events"
    ON event_activity_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM calendar_events
            WHERE calendar_events.id = event_activity_log.event_id
            AND (
                calendar_events.user_id = auth.uid()
                OR
                EXISTS (
                    SELECT 1 FROM event_attendees
                    WHERE event_attendees.event_id = calendar_events.id
                    AND event_attendees.user_id = auth.uid()
                )
            )
        )
    );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_calendar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER calendar_events_updated_at_trigger
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_updated_at();

CREATE TRIGGER event_attendees_updated_at_trigger
    BEFORE UPDATE ON event_attendees
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_updated_at();

CREATE TRIGGER google_calendar_connections_updated_at_trigger
    BEFORE UPDATE ON google_calendar_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_updated_at();

-- Function to log event changes
CREATE OR REPLACE FUNCTION log_event_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO event_activity_log (event_id, user_id, action, details)
        VALUES (NEW.id, NEW.user_id, 'created', row_to_json(NEW));
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO event_activity_log (event_id, user_id, action, details)
        VALUES (NEW.id, auth.uid(), 'updated', jsonb_build_object(
            'old', row_to_json(OLD),
            'new', row_to_json(NEW)
        ));
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO event_activity_log (event_id, user_id, action, details)
        VALUES (OLD.id, auth.uid(), 'deleted', row_to_json(OLD));
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for event activity logging
CREATE TRIGGER calendar_events_activity_trigger
    AFTER INSERT OR UPDATE OR DELETE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION log_event_activity();

-- Function to automatically add organizer as attendee
CREATE OR REPLACE FUNCTION add_organizer_as_attendee()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO event_attendees (event_id, user_id, email, role, status)
    SELECT
        NEW.id,
        NEW.user_id,
        auth.email(),
        'organizer',
        'accepted'
    WHERE NOT EXISTS (
        SELECT 1 FROM event_attendees
        WHERE event_id = NEW.id AND user_id = NEW.user_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to add organizer as attendee
CREATE TRIGGER add_organizer_trigger
    AFTER INSERT ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION add_organizer_as_attendee();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get events in date range
CREATE OR REPLACE FUNCTION get_events_in_range(
    p_user_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    event_type TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    status TEXT,
    color TEXT,
    attendee_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ce.id,
        ce.title,
        ce.description,
        ce.event_type,
        ce.start_date,
        ce.end_date,
        ce.status,
        ce.color,
        COUNT(ea.id) as attendee_count
    FROM calendar_events ce
    LEFT JOIN event_attendees ea ON ce.id = ea.event_id
    WHERE
        (ce.user_id = p_user_id OR ea.user_id = p_user_id)
        AND ce.start_date <= p_end_date
        AND ce.end_date >= p_start_date
    GROUP BY ce.id
    ORDER BY ce.start_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE calendar_events IS 'Stores all calendar events including bookings, meetings, and personal events';
COMMENT ON TABLE event_attendees IS 'Tracks attendees/participants for each calendar event';
COMMENT ON TABLE google_calendar_connections IS 'Stores Google Calendar OAuth tokens and sync settings';
COMMENT ON TABLE event_activity_log IS 'Audit log for all event changes';

COMMENT ON COLUMN calendar_events.status IS 'Event status: pending (yellow), confirmed (green), cancelled (red), completed (grey)';
COMMENT ON COLUMN calendar_events.color IS 'Hex color code for calendar display';
COMMENT ON COLUMN calendar_events.chat_request_id IS 'Links event to AI chat request';
COMMENT ON COLUMN calendar_events.booking_id IS 'Links event to actual booking (jets, hotels, etc.)';
COMMENT ON COLUMN google_calendar_connections.sync_direction IS 'Sync direction: to_google, from_google, or both';
