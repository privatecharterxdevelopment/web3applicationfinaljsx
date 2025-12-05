import { createClient } from '@supabase/supabase-js';

// Get Supabase config from environment - NO HARDCODED VALUES
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable. Please add it to .env.local');
}
if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable. Please add it to .env.local');
}

/**
 * Get a storage mechanism that works in all browser modes including iOS private browsing.
 * Falls back to sessionStorage or in-memory storage if localStorage is unavailable.
 */
const getStorage = (): Storage => {
  if (typeof window === 'undefined') {
    // SSR environment - return dummy storage
    return {
      length: 0,
      clear: () => {},
      getItem: () => null,
      key: () => null,
      removeItem: () => {},
      setItem: () => {},
    };
  }

  // Try localStorage first
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch (e) {
    // localStorage not available (iOS private browsing, storage quota exceeded, etc.)
  }

  // Try sessionStorage as fallback
  try {
    const testKey = '__storage_test__';
    window.sessionStorage.setItem(testKey, testKey);
    window.sessionStorage.removeItem(testKey);
    console.warn('localStorage unavailable, using sessionStorage (session will not persist across tabs)');
    return window.sessionStorage;
  } catch (e) {
    // sessionStorage also not available
  }

  // Ultimate fallback: in-memory storage
  console.warn('No browser storage available, using in-memory storage (session will be lost on refresh)');
  const memoryStorage: Record<string, string> = {};
  return {
    length: 0,
    clear: () => { Object.keys(memoryStorage).forEach(key => delete memoryStorage[key]); },
    getItem: (key: string) => memoryStorage[key] || null,
    key: (index: number) => Object.keys(memoryStorage)[index] || null,
    removeItem: (key: string) => { delete memoryStorage[key]; },
    setItem: (key: string, value: string) => { memoryStorage[key] = value; },
  };
};

// Create Supabase client with proper browser configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: getStorage(),
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