import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://noaifjmpumjawayimeyo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vYWlmam1wdW1qYXdheWltZXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwNDUzNDUsImV4cCI6MjA1NTYyMTM0NX0.BHjvsZ1aCQgcraUp8K8UOBXLwSNTXa7Zc5pi1Ghn7jw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)