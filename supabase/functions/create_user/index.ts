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

    const { email, role, tenant_id } = await req.json()

    if (!email || !role || !tenant_id) {
      throw new Error('Missing required fields: email, role, tenant_id')
    }

    // Create user with Supabase Auth Admin API
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      email_confirm: false, // Will be confirmed via email
      user_metadata: {
        tenant_id: tenant_id,
        role: role
      }
    })

    if (authError) {
      throw new Error(`Failed to create user: ${authError.message}`)
    }

    // Create profile entry
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: email,
        tenant_id: tenant_id
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Don't throw here as the user is already created
    }

    // Create user role entry
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        tenant_id: tenant_id,
        role: role
      })

    if (roleError) {
      throw new Error(`Failed to assign role: ${roleError.message}`)
    }

    // Send invitation email via Brevo
    if (Deno.env.get('BREVO_API_KEY')) {
      try {
        const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': Deno.env.get('BREVO_API_KEY') ?? ''
          },
          body: JSON.stringify({
            sender: {
              name: 'Vuosikello',
              email: Deno.env.get('FROM_EMAIL') ?? 'noreply@yourdomain.com'
            },
            to: [{
              email: email,
              name: email
            }],
            subject: 'Welcome to Vuosikello - Account Created',
            htmlContent: `
              <h2>Welcome to Vuosikello!</h2>
              <p>Your account has been created with ${role} permissions.</p>
              <p>Please check your email to confirm your account and set your password.</p>
              <p>If you didn't receive a confirmation email, please contact your administrator.</p>
            `
          })
        })

        if (!brevoResponse.ok) {
          console.error('Failed to send invitation email via Brevo')
        }
      } catch (emailError) {
        console.error('Email sending error:', emailError)
        // Don't throw here as the user is already created
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: authData.user,
        message: 'User created successfully and invitation sent'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Create user error:', error)
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
