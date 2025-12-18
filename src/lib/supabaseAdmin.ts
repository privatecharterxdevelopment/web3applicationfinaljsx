import { createClient } from '@supabase/supabase-js';

// Supabase Admin Client with Service Role Key - bypasses RLS
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91YmVjbXN0cXR6ZG5ldnlxYXZ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTA5NzQxMiwiZXhwIjoyMDY2NjczNDEyfQ.35V_vACN8pmSKku3yOvtijmwUpdnPHR2-UqPm7rfMIA';

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

// Admin client bypasses RLS - use only for admin operations
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
