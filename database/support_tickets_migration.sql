-- Create support_tickets table for Zendesk integration
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    zendesk_ticket_id BIGINT,
    subject TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'open', 'hold', 'solved', 'closed')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    tags TEXT[],
    ticket_data JSONB,
    external_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create support_ticket_messages table for conversation history
CREATE TABLE IF NOT EXISTS support_ticket_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    zendesk_message_id BIGINT,
    author_name TEXT,
    author_email TEXT,
    content TEXT NOT NULL,
    is_public BOOLEAN DEFAULT true,
    message_type TEXT DEFAULT 'comment',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket_id ON support_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_created_at ON support_ticket_messages(created_at);

-- Enable Row Level Security
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for support_tickets
CREATE POLICY "Users can view their own support tickets" 
ON support_tickets FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own support tickets" 
ON support_tickets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own support tickets" 
ON support_tickets FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for support_ticket_messages
CREATE POLICY "Users can view messages for their tickets" 
ON support_ticket_messages FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM support_tickets 
        WHERE support_tickets.id = support_ticket_messages.ticket_id 
        AND support_tickets.user_id = auth.uid()
    )
);

CREATE POLICY "Users can create messages for their tickets" 
ON support_ticket_messages FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM support_tickets 
        WHERE support_tickets.id = support_ticket_messages.ticket_id 
        AND support_tickets.user_id = auth.uid()
    )
);

-- Grant necessary permissions
GRANT ALL ON support_tickets TO authenticated;
GRANT ALL ON support_ticket_messages TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;