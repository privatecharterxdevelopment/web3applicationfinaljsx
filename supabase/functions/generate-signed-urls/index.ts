import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create client with user context for permission checking
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    // Create service role client for storage operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      console.error('Authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('User authenticated:', user.id);

    // Check user permissions for KYC applications read access
    const { data: adminSettings, error: permissionsError } = await supabaseAdmin
      .from('admin_settings')
      .select('settings')
      .eq('user_id', user.id)
      .single();

    if (permissionsError) {
      console.error('Error fetching user permissions:', permissionsError);
      return new Response(
        JSON.stringify({ error: 'Access denied - unable to verify permissions' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if user has KYC applications read permission
    const permissions = adminSettings?.settings?.permissions;
    const hasKycReadPermission = permissions?.kyc_applications?.read === true;

    if (!hasKycReadPermission) {
      console.error('User lacks KYC read permissions:', user.id);
      return new Response(
        JSON.stringify({ error: 'Access denied - insufficient permissions for KYC applications' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('User has KYC read permissions:', user.id);

    // Get public URL from request body
    const { publicUrl }: { publicUrl: string } = await req.json();

    if (!publicUrl) {
      return new Response(
        JSON.stringify({ error: 'Public URL is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Processing signed URL generation for:', publicUrl);

    try {
      // Extract file path from the public URL
      const url = new URL(publicUrl);
      let filePath = url.pathname;

      // Extract the actual file path from the public URL
      filePath = filePath.split('securedocuments/')[1];

      if (!filePath) {
        return new Response(
          JSON.stringify({ error: 'Invalid file path in public URL' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log('Creating signed URL for:', filePath);

      // Generate signed URL with 5 minute expiry (shorter since it's on-demand)
      const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
        .from('securedocuments')
        .createSignedUrl(filePath, 300);

      if (signedUrlError || !signedUrlData?.signedUrl) {
        console.error('Error creating signed URL:', signedUrlError);
        return new Response(
          JSON.stringify({
            error: 'Failed to create signed URL',
            details: signedUrlError?.message
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log('Signed URL created successfully for:', filePath);

      return new Response(
        JSON.stringify({ signedUrl: signedUrlData.signedUrl }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Error processing document URL:', error);
      return new Response(
        JSON.stringify({
          error: 'Document URL processing error',
          details: error.message
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Error in generate-signed-urls function:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: Deno.env.get('ENVIRONMENT') === 'development' ? error.toString() : undefined
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});