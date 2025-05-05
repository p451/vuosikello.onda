import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kwgqmiwprnujqkjihllg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Z3FtaXdwcm51anFramlobGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1ODMxMDMsImV4cCI6MjA1OTE1OTEwM30.JhcYebTLjYwk8udLS85gf5i_Mj2foSG5ZrrmEhRoW44';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Z3FtaXdwcm51anFramlobGxnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzU4MzEwMywiZXhwIjoyMDU5MTU5MTAzfQ.qke0O9tgAbgqQ9plsMsA5NWCOg8XehAY8HL0s0P45jk';

// Create singleton instances
let supabaseInstance = null;
let supabaseAdminInstance = null;

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
})();

export const supabaseAdmin = (() => {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseAdminInstance;
})();
