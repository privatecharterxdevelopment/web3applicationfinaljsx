// Claude Edge Service - Secure API calls via Supabase Edge Function
// This keeps the API key server-side only
// Supports both streaming and non-streaming responses

import { supabase } from '../lib/supabase';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claude-chat`;

class ClaudeEdgeService {
  constructor() {
    this.systemPrompt = '';
  }

  setSystemPrompt(prompt) {
    this.systemPrompt = prompt;
  }

  /**
   * Get auth headers for requests
   */
  async getHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token;

    const headers = {
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    return headers;
  }

  /**
   * Create a message (non-streaming)
   */
  async createMessage({
    messages,
    system,
    model = 'claude-sonnet-4-20250514',
    max_tokens = 4096,
    temperature = 0.7,
    tools = null,
    tool_choice = null
  }) {
    try {
      const headers = await this.getHeaders();

      const body = {
        messages,
        system: system || this.systemPrompt,
        model,
        max_tokens,
        temperature,
        stream: false
      };

      if (tools && tools.length > 0) {
        body.tools = tools;
        console.log('🔧 Tools being sent to Claude API:', tools.map(t => t.name));
      } else {
        console.log('⚠️ NO TOOLS being sent to Claude API!');
      }

      if (tool_choice) {
        body.tool_choice = tool_choice;
        console.log('🔧 tool_choice:', tool_choice);
      }

      console.log('📡 Calling Claude via Edge Function...');

      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Edge function error:', response.status, errorData);
        throw new Error(errorData.error || `Edge function error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Claude response received via Edge Function');
      return data;

    } catch (error) {
      console.error('ClaudeEdgeService error:', error);
      throw error;
    }
  }

  /**
   * Stream a message with real-time text chunks
   * @param {Object} params - Message parameters
   * @param {Function} onChunk - Callback for each text chunk (text, fullText)
   * @param {Function} onComplete - Optional callback when stream completes
   * @returns {Promise<string>} - Complete response text
   */
  async streamMessage({
    messages,
    system,
    model = 'claude-sonnet-4-20250514',
    max_tokens = 4096,
    temperature = 0.7,
    tools = null,
    tool_choice = null
  }, onChunk, onComplete = null) {
    try {
      const headers = await this.getHeaders();

      const body = {
        messages,
        system: system || this.systemPrompt,
        model,
        max_tokens,
        temperature,
        stream: true
      };

      if (tools && tools.length > 0) {
        body.tools = tools;
      }

      if (tool_choice) {
        body.tool_choice = tool_choice;
      }

      console.log('📡 Starting streaming call to Claude via Edge Function...');

      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Edge function streaming error:', response.status, errorData);
        throw new Error(errorData.error || `Edge function error: ${response.status}`);
      }

      // Process the SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE events in the buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const event = JSON.parse(data);

              // Handle content_block_delta events (text chunks)
              if (event.type === 'content_block_delta' && event.delta?.text) {
                const chunk = event.delta.text;
                fullText += chunk;
                if (onChunk) {
                  onChunk(chunk, fullText);
                }
              }

              // Handle message_stop event
              if (event.type === 'message_stop') {
                console.log('✅ Streaming complete');
              }
            } catch {
              // Ignore JSON parse errors for non-JSON lines
            }
          }
        }
      }

      console.log('✅ Stream finished, total length:', fullText.length);

      if (onComplete) {
        onComplete(fullText);
      }

      return fullText;

    } catch (error) {
      console.error('ClaudeEdgeService streaming error:', error);
      throw error;
    }
  }

  // Convenience method that mimics the Anthropic SDK interface
  get messages() {
    return {
      create: (params) => this.createMessage(params),
      stream: (params, onChunk, onComplete) => this.streamMessage(params, onChunk, onComplete)
    };
  }
}

export const claudeEdgeService = new ClaudeEdgeService();
export default ClaudeEdgeService;
