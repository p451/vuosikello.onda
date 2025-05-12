import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kwgqmiwprnujqkjihllg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Z3FtaXdwcm51anFramlobGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MDU1NTEsImV4cCI6MjA2MjI4MTU1MX0.plhNaMEg8jiiNBvkMNPPbtsevM43ArGEXVe_TbVJE54'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

const createUser = async (email, tenant_id) => {
  const { data, error } = await supabase.auth.api.createUser({
    email,
    user_metadata: { tenant_id },
    email_confirm: false,
    invite_email: true // Tämä lähettää kutsusähköpostin
  })

  if (error) {
    console.error('Error creating user:', error)
    return null
  }

  return data
}