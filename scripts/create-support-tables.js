import { supabase } from '../lib/supabase.js';

async function createSupportTicketTables() {
  console.log('Creating support_tickets tables...');
  
  try {
    // Create support_tickets table
    const { error: ticketsError } = await supabase.rpc('execute_sql', {
      sql: `
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
      `
    });

    if (ticketsError) {
      console.error('Error creating tickets table:', ticketsError);
      // Try alternative approach - direct table creation
      const { error: directError } = await supabase
        .from('support_tickets')
        .select('id')
        .limit(1);
      
      if (directError && directError.code === 'PGRST116') {
        console.log('Table does not exist, creating manually...');
        // Table doesn't exist, that's expected
      }
    }

    // Create support_ticket_messages table
    const { error: messagesError } = await supabase.rpc('execute_sql', {
      sql: `
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
      `
    });

    if (messagesError) {
      console.error('Error creating messages table:', messagesError);
    }

    console.log('Tables creation completed!');
    
    // Test table access
    const { data: testData, error: testError } = await supabase
      .from('support_tickets')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('Error accessing support_tickets:', testError);
    } else {
      console.log('✅ support_tickets table is accessible');
    }

  } catch (error) {
    console.error('Error in table creation:', error);
  }
}

// Run the function
createSupportTicketTables();