/*
  # Admin User Management Edge Function

  This function handles secure admin operations for user management including:
  1. Creating new users with system_users records
  2. Deleting users from both auth and system_users
  3. Updating user status
  4. Resetting user passwords
*/

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the user is authenticated and is an admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: systemUser, error: systemUserError } = await supabaseAdmin
      .from('system_users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (systemUserError || systemUser?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, userData, userId, deleteFromAuth, newPassword } = await req.json()

    switch (action) {
      case 'create_user': {
        // Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: {
            name: userData.name,
            role: userData.role
          }
        })

        if (authError) {
          throw new Error(`Auth creation failed: ${authError.message}`)
        }

        if (!authData.user) {
          throw new Error('Failed to create user')
        }

        // Create system user record
        const { error: systemUserError } = await supabaseAdmin
          .from('system_users')
          .insert([{
            id: authData.user.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            department: userData.department || null,
            phone: userData.phone || null,
            is_active: true,
            total_sales: 0
          }])

        if (systemUserError) {
          // Cleanup: delete the auth user if system user creation fails
          try {
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
          } catch (cleanupError) {
            console.error('Failed to cleanup auth user:', cleanupError)
          }
          throw new Error(`System user creation failed: ${systemUserError.message}`)
        }

        return new Response(
          JSON.stringify({ success: true, user: authData.user }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'delete_user': {
        if (!userId) {
          throw new Error('User ID is required for deletion')
        }

        // Delete from system_users table first
        const { error: systemError } = await supabaseAdmin
          .from('system_users')
          .delete()
          .eq('id', userId)

        if (systemError) {
          throw new Error(`System user deletion failed: ${systemError.message}`)
        }

        // Delete from auth if requested
        if (deleteFromAuth) {
          try {
            const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
            if (authError) {
              console.warn('Could not delete auth user:', authError)
              // Don't throw here as system user is already deleted
            }
          } catch (err) {
            console.warn('Error during auth user deletion:', err)
            // Continue execution since the system_users record was deleted successfully
          }
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update_user_status': {
        if (!userId || userData.is_active === undefined) {
          throw new Error('User ID and status are required')
        }

        const { error } = await supabaseAdmin
          .from('system_users')
          .update({ 
            is_active: userData.is_active
          })
          .eq('id', userId)

        if (error) {
          throw new Error(`Status update failed: ${error.message}`)
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'reset_password': {
        if (!userId || !newPassword) {
          throw new Error('User ID and new password are required')
        }

        try {
          // Update password in auth
          const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { password: newPassword }
          )

          if (authError) {
            throw new Error(`Password reset failed: ${authError.message}`)
          }

          // Log the password reset action
          const { error: logError } = await supabaseAdmin
            .from('user_activity_logs')
            .insert([{
              user_id: userId,
              action: 'password_reset',
              details: {
                reset_by: user.id,
                reset_by_email: user.email
              },
              ip_address: req.headers.get('x-forwarded-for') || null,
              user_agent: req.headers.get('user-agent') || null
            }])

          if (logError) {
            console.warn('Failed to log password reset:', logError)
          }

          return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } catch (err) {
          console.error('Password reset error:', err)
          throw new Error(`Password reset failed: ${err.message}`)
        }
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Admin operation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})