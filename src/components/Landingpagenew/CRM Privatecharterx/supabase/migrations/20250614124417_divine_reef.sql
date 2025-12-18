/*
  # Enable pg_net extension for chat notifications

  1. Extensions
    - Enable `pg_net` extension to allow database HTTP requests
    - This is required for the chat message notification trigger to work properly

  2. Purpose
    - The chat_message_notification_trigger uses pg_net to make HTTP requests to edge functions
    - Without this extension, the "net" schema doesn't exist, causing the error
*/

-- Enable the pg_net extension for HTTP requests from database
CREATE EXTENSION IF NOT EXISTS pg_net;