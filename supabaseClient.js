import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kwgqmiwprnujqkjihllg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Z3FtaXdwcm51anFramlobGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1ODMxMDMsImV4cCI6MjA1OTE1OTEwM30.JhcYebTLjYwk8udLS85gf5i_Mj2foSG5ZrrmEhRoW44'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)