// Claude Edge Service - Secure API calls via Supabase Edge Function
// This keeps the API key server-side only

import { supabase } from '../lib/supabase';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claude-chat`;

class ClaudeEdgeService {
  constructor() {
    this.systemPrompt = '';
  }

  setSystemPrompt(prompt) {
    this.systemPrompt = prompt;
  }

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
      // Get auth token for authenticated requests
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;

      const headers = {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const body = {
        messages,
        system: system || this.systemPrompt,
        model,
        max_tokens,
        temperature
      };

      if (tools && tools.length > 0) {
        body.tools = tools;
      }

      if (tool_choice) {
        body.tool_choice = tool_choice;
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

  // Convenience method that mimics the Anthropic SDK interface
  get messages() {
    return {
      create: (params) => this.createMessage(params)
    };
  }
}

export const claudeEdgeService = new ClaudeEdgeService();
export default ClaudeEdgeService;
