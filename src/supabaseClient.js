import { createClient } from '@supabase/supabase-js'

// Get from environment variables with fallback to original values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kwgqmiwprnujqkjihllg.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Z3FtaXdwcm51anFramlobGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MDU1NTEsImV4cCI6MjA2MjI4MTU1MX0.plhNaMEg8jiiNBvkMNPPbtsevM43ArGEXVe_TbVJE54';

// Ensure we have valid values
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase configuration is missing. Please check your environment variables.');
}

// Debugging: log if environment variables are loaded (development only)
if (import.meta.env.DEV) {
  console.log('Supabase URL:', supabaseUrl);
  console.log('Environment variables loaded:', !!import.meta.env.VITE_SUPABASE_URL);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
    storageKey: 'vuosikello-auth'
  }
});
