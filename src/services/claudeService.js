// Claude 3.5 Sonnet API Service for AIChat
import Anthropic from '@anthropic-ai/sdk';

class ClaudeService {
  constructor() {
    this.apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
    this.client = null;
    this.systemPrompt = '';
    
    console.log('🔑 Claude API Key loaded:', this.apiKey ? 'YES ✅' : 'NO ❌');
    console.log('🔑 API Key length:', this.apiKey?.length || 0);
    console.log('🔑 API Key starts with:', this.apiKey?.substring(0, 15) || 'N/A');
    
    if (this.apiKey) {
      this.client = new Anthropic({
        apiKey: this.apiKey,
        dangerouslyAllowBrowser: true // Required for client-side usage
      });
      console.log('✅ Claude client initialized');
    } else {
      console.error('❌ VITE_ANTHROPIC_API_KEY not found in environment');
    }
  }

  setSystemPrompt(prompt) {
    this.systemPrompt = prompt;
  }

  isEnabled() {
    return !!this.client;
  }

  /**
   * Send a message to Claude and get a response
   * @param {Array} messages - Conversation history [{role: 'user'|'assistant', content: string}]
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - Claude's response
   */
  async sendMessage(messages, options = {}) {
    if (!this.client) {
      throw new Error('Claude API key not configured. Please set VITE_ANTHROPIC_API_KEY in your .env file.');
    }

    try {
      console.log('📤 Sending to Claude:', {
        messageCount: messages.length,
        lastMessage: messages[messages.length - 1]?.content?.substring(0, 100)
      });
      
      const response = await this.client.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: options.maxTokens || 8192,
        temperature: options.temperature || 0.7,
        system: this.systemPrompt,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      });

      console.log('📥 Claude response:', response);

      if (!response || !response.content || !response.content[0] || !response.content[0].text) {
        console.error('❌ Invalid Claude response structure:', response);
        throw new Error('Invalid response from Claude API');
      }

      return response.content[0].text;
    } catch (error) {
      console.error('❌ Claude API Error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        type: error.type,
        response: error.response
      });
      throw error;
    }
  }

  /**
   * Stream a response from Claude (for real-time typing effect)
   * @param {Array} messages - Conversation history
   * @param {Function} onChunk - Callback for each text chunk
   * @param {Object} options - Additional options
   */
  async streamMessage(messages, onChunk, options = {}) {
    if (!this.client) {
      throw new Error('Claude API key not configured.');
    }

    try {
      const stream = await this.client.messages.create({
        model: 'claude-3-5-sonnet-latest',
        max_tokens: options.maxTokens || 16384,
        temperature: options.temperature || 0.7,
        system: this.systemPrompt,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        stream: true
      });

      let fullText = '';
      
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
          const text = chunk.delta.text;
          fullText += text;
          onChunk(text, fullText);
        }
      }

      return fullText;
    } catch (error) {
      console.error('Claude Streaming Error:', error);
      throw error;
    }
  }

  /**
   * Extract structured data from conversation (for search parameters)
   * @param {string} userMessage - User's message
   * @param {Array} conversationHistory - Previous messages
   * @returns {Promise<Object>} - Extracted parameters
   */
  async extractSearchParameters(userMessage, conversationHistory = []) {
    if (!this.client) {
      return this.fallbackExtraction(userMessage);
    }

    try {
      const extractionPrompt = `Extract search parameters from the user's message. Return ONLY a JSON object with these fields (use null if not mentioned):
{
  "serviceType": "jet|helicopter|yacht|car|empty_leg",
  "from": "city name",
  "to": "city name", 
  "passengers": number,
  "date": "YYYY-MM-DD or relative like 'next week'",
  "location": "city name for single-location services like cars/helicopters"
}`;

      const messages = [
        ...conversationHistory.slice(-3), // Last 3 messages for context
        { role: 'user', content: userMessage }
      ];

      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 2048,
        temperature: 0.3,
        system: extractionPrompt,
        messages: messages
      });

      const jsonMatch = response.content[0].text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return this.fallbackExtraction(userMessage);
    } catch (error) {
      console.error('Parameter extraction error:', error);
      return this.fallbackExtraction(userMessage);
    }
  }

  /**
   * Fallback extraction using regex (if API fails)
   */
  fallbackExtraction(message) {
    const lower = message.toLowerCase();
    
    const serviceType = 
      lower.match(/helicopter/i) ? 'helicopter' :
      lower.match(/empty\s*leg/i) ? 'empty_leg' :
      lower.match(/yacht/i) ? 'yacht' :
      lower.match(/car|chauffeur/i) ? 'car' :
      lower.match(/jet|aircraft/i) ? 'jet' : null;

    const passengers = parseInt(lower.match(/(\d+)\s+(?:passenger|person|people|pax)/)?.[1]) || null;
    
    const fromMatch = lower.match(/\bfrom\s+([a-z\s]+?)(?:\s+to|\s+for|,|$)/i);
    const toMatch = lower.match(/\bto\s+([a-z\s]+?)(?:\s+for|,|$)/i);
    const inMatch = lower.match(/\bin\s+([a-z\s]+?)(?:\s+for|\s+next|\s+this|,|$)/i);
    
    return {
      serviceType,
      from: fromMatch?.[1]?.trim() || null,
      to: toMatch?.[1]?.trim() || null,
      passengers,
      location: inMatch?.[1]?.trim() || null,
      date: null
    };
  }
}

// Singleton instance
export const claudeService = new ClaudeService();
export default ClaudeService;
