import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id } = await req.json()

    if (!user_id) {
      throw new Error('Missing required field: user_id')
    }

    // Delete user role entries
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .delete()
      .eq('user_id', user_id)

    if (roleError) {
      console.error('Role deletion error:', roleError)
    }

    // Delete profile entry
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .delete()
      .eq('id', user_id)

    if (profileError) {
      console.error('Profile deletion error:', profileError)
    }

    // Delete user from Supabase Auth
    const { error: authError } = await supabaseClient.auth.admin.deleteUser(user_id)

    if (authError) {
      throw new Error(`Failed to delete user: ${authError.message}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'User deleted successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Delete user error:', error)
    return new Response(
      JSON.stringify({ 
        error: { 
          message: error.message || 'An unexpected error occurred' 
        } 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
