import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BATCH_SIZE = 50; // Process participants in batches to avoid memory issues

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
    const { messageId } = await req.json();

    if (!messageId) {
      return new Response(
        JSON.stringify({ error: "Message ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get message details with minimal data to reduce memory usage
    const { data: message, error: messageError } = await supabaseAdmin
      .from("chat_messages")
      .select(`
        id,
        conversation_id,
        sender_id,
        message,
        chat_users!sender_id (name),
        chat_conversations!conversation_id (
          name,
          is_group
        )
      `)
      .eq("id", messageId)
      .single();

    if (messageError) {
      throw new Error(`Error fetching message: ${messageError.message}`);
    }

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get total count of participants first
    const { count: totalParticipants, error: countError } = await supabaseAdmin
      .from("chat_participants")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", message.conversation_id)
      .neq("user_id", message.sender_id);

    if (countError) {
      throw new Error(`Error counting participants: ${countError.message}`);
    }

    if (!totalParticipants || totalParticipants === 0) {
      return new Response(
        JSON.stringify({ success: true, notified: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For very large groups (>100 participants), skip notifications to prevent memory issues
    if (totalParticipants > 100) {
      console.log(`Skipping notifications for large group with ${totalParticipants} participants`);
      return new Response(
        JSON.stringify({ success: true, notified: 0, skipped: true, reason: "Large group" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let totalNotified = 0;
    let offset = 0;

    // Process participants in batches
    while (offset < totalParticipants) {
      const { data: participants, error: participantsError } = await supabaseAdmin
        .from("chat_participants")
        .select(`
          user_id,
          chat_users!user_id (name, email)
        `)
        .eq("conversation_id", message.conversation_id)
        .neq("user_id", message.sender_id)
        .range(offset, offset + BATCH_SIZE - 1);

      if (participantsError) {
        throw new Error(`Error fetching participants: ${participantsError.message}`);
      }

      if (!participants || participants.length === 0) {
        break;
      }

      // Create notifications for this batch
      const notifications = participants.map((participant) => ({
        user_id: participant.user_id,
        type: "chat_message",
        title: message.chat_conversations.is_group
          ? `New message in ${message.chat_conversations.name || "Group Chat"}`
          : `New message from ${message.chat_users.name}`,
        message: message.message.length > 50
          ? `${message.message.substring(0, 50)}...`
          : message.message,
        data: {
          conversation_id: message.conversation_id,
          message_id: message.id,
          sender_id: message.sender_id,
          sender_name: message.chat_users.name,
          is_group: message.chat_conversations.is_group,
          group_name: message.chat_conversations.name
        },
        is_read: false
      }));

      // Insert notifications for this batch
      const { error: notificationError } = await supabaseAdmin
        .from("notifications")
        .insert(notifications);

      if (notificationError) {
        throw new Error(`Error creating notifications: ${notificationError.message}`);
      }

      totalNotified += notifications.length;
      offset += BATCH_SIZE;

      // Clear the notifications array to free memory
      notifications.length = 0;
    }

    return new Response(
      JSON.stringify({ success: true, notified: totalNotified }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing chat notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});