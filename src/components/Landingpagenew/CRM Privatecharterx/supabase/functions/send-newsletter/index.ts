import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Parse request body
    const { campaignId } = await req.json();

    if (!campaignId) {
      return new Response(
        JSON.stringify({ error: "Campaign ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from("newsletter_campaigns")
      .select(`
        *,
        newsletters!newsletter_id (title, subject, template_html, content)
      `)
      .eq("id", campaignId)
      .single();

    if (campaignError) {
      throw new Error(`Error fetching campaign: ${campaignError.message}`);
    }

    if (!campaign) {
      return new Response(
        JSON.stringify({ error: "Campaign not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if campaign is already sent
    if (campaign.status === "sent") {
      return new Response(
        JSON.stringify({ error: "Campaign already sent" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update campaign status to sending
    const { error: updateError } = await supabaseAdmin
      .from("newsletter_campaigns")
      .update({
        status: "sending",
        updated_at: new Date().toISOString()
      })
      .eq("id", campaignId);

    if (updateError) {
      throw new Error(`Error updating campaign status: ${updateError.message}`);
    }

    // Get recipients
    const { data: recipients, error: recipientsError } = await supabaseAdmin
      .from("newsletter_recipients")
      .select("*")
      .eq("campaign_id", campaignId)
      .eq("status", "pending");

    if (recipientsError) {
      throw new Error(`Error fetching recipients: ${recipientsError.message}`);
    }

    if (!recipients || recipients.length === 0) {
      // Update campaign status to sent if no recipients
      await supabaseAdmin
        .from("newsletter_campaigns")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", campaignId);

      return new Response(
        JSON.stringify({ success: true, message: "No recipients to send to" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For demo purposes, we'll just simulate sending
    // In a real implementation, you would send actual emails
    const sentCount = recipients.length;
    const now = new Date().toISOString();

    // Update all recipients to sent
    const { error: recipientUpdateError } = await supabaseAdmin
      .from("newsletter_recipients")
      .update({
        status: "sent",
        sent_at: now
      })
      .eq("campaign_id", campaignId)
      .eq("status", "pending");

    if (recipientUpdateError) {
      throw new Error(`Error updating recipients: ${recipientUpdateError.message}`);
    }

    // Update campaign to sent
    const { error: campaignUpdateError } = await supabaseAdmin
      .from("newsletter_campaigns")
      .update({
        status: "sent",
        sent_at: now,
        updated_at: now
      })
      .eq("id", campaignId);

    if (campaignUpdateError) {
      throw new Error(`Error updating campaign: ${campaignUpdateError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sentCount,
        message: `Successfully sent to ${sentCount} recipients` 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending newsletter:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});