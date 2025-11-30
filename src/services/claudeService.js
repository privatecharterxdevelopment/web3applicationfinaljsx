// Claude Service - Now using secure Edge Function (API key stays server-side)
// This is a wrapper around claudeEdgeService for backwards compatibility
import { claudeEdgeService } from './claudeEdgeService';

class ClaudeService {
  constructor() {
    this.systemPrompt = '';
  }

  setSystemPrompt(prompt) {
    this.systemPrompt = prompt;
    claudeEdgeService.setSystemPrompt(prompt);
  }

  isEnabled() {
    // Always enabled - edge function handles auth
    return true;
  }

  /**
   * Send a message to Claude via Edge Function and get a response
   * @param {Array} messages - Conversation history [{role: 'user'|'assistant', content: string}]
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - Claude's response
   */
  async sendMessage(messages, options = {}) {
    try {
      const response = await claudeEdgeService.messages.create({
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        system: this.systemPrompt,
        model: 'claude-sonnet-4-20250514',
        max_tokens: options.maxTokens || 8192,
        temperature: options.temperature || 0.7
      });

      if (!response || !response.content || !response.content[0] || !response.content[0].text) {
        throw new Error('Invalid response from Claude API');
      }

      return response.content[0].text;
    } catch (error) {
      console.error('Claude API Error:', error.message);
      throw error;
    }
  }

  /**
   * Stream a response from Claude (NOTE: streaming not yet supported via edge function)
   * Falls back to regular message for now
   * @param {Array} messages - Conversation history
   * @param {Function} onChunk - Callback for each text chunk
   * @param {Object} options - Additional options
   */
  async streamMessage(messages, onChunk, options = {}) {
    // Edge function doesn't support streaming yet, use regular message
    const fullText = await this.sendMessage(messages, options);
    onChunk(fullText, fullText);
    return fullText;
  }

  /**
   * Extract structured data from conversation (for search parameters)
   * @param {string} userMessage - User's message
   * @param {Array} conversationHistory - Previous messages
   * @returns {Promise<Object>} - Extracted parameters
   */
  async extractSearchParameters(userMessage, conversationHistory = []) {
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

      const response = await claudeEdgeService.messages.create({
        messages,
        system: extractionPrompt,
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        temperature: 0.3
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
