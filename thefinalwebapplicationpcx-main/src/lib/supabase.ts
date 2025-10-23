import { createClient } from '@supabase/supabase-js';

// Use your hardcoded values (safe for client-side)
const supabaseUrl = "https://oubecmstqtzdnevyqavu.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91YmVjbXN0cXR6ZG5ldnlxYXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwOTc0MTIsImV4cCI6MjA2NjY3MzQxMn0.CQTa4WE0oGF8y5xm3CSeyK6O3fcxhpJv50l_xvHKQfs";

// Create Supabase client with proper browser configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    flowType: 'pkce'
  }
});

export type SupabaseClient = typeof supabase;

// Simple connection test (browser-safe)
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error);
    return false;
  }
};