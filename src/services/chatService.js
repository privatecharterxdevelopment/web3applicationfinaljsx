import { supabase } from '../lib/supabase';

/**
 * AI Chat Service
 * Handles saving and loading chat sessions to/from Supabase
 */

export const chatService = {
  /**
   * Create a new chat session
   */
  async createChat(userId, title = 'New Conversation', initialMessage = null) {
    try {
      const messages = initialMessage ? [initialMessage] : [];

      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .insert({
          user_id: userId,
          title,
          messages
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Chat created:', data.id);
      return { success: true, chat: data };
    } catch (error) {
      console.error('❌ Error creating chat:', error);
      return { success: false, error };
    }
  },

  /**
   * Load all chats for a user
   */
  async loadUserChats(userId) {
    try {
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      console.log(`✅ Loaded ${data.length} chats for user`);
      return { success: true, chats: data };
    } catch (error) {
      console.error('❌ Error loading chats:', error);
      return { success: false, error, chats: [] };
    }
  },

  /**
   * Load a specific chat by ID
   */
  async loadChat(chatId, userId) {
    try {
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .select('*')
        .eq('id', chatId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      return { success: true, chat: data };
    } catch (error) {
      console.error('❌ Error loading chat:', error);
      return { success: false, error };
    }
  },

  /**
   * Update chat messages
   * Uses upsert to create the chat if it doesn't exist
   */
  async updateChatMessages(chatId, messages, userId) {
    try {
      // First try to update existing chat
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .update({ messages, updated_at: new Date().toISOString() })
        .eq('id', chatId)
        .eq('user_id', userId)
        .select();

      // If no rows updated, the chat doesn't exist yet - create it
      if (!error && (!data || data.length === 0)) {
        console.log('📝 Chat not found, creating new chat session...');

        // Generate title from first user message
        const firstUserMsg = messages.find(m => m.role === 'user');
        const title = firstUserMsg?.content?.slice(0, 50) || 'New Chat';

        const { data: newChat, error: createError } = await supabase
          .from('ai_chat_sessions')
          .insert({
            id: chatId,
            user_id: userId,
            title,
            messages,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ Error creating chat:', createError);
          return { success: false, error: createError };
        }

        return { success: true, chat: newChat, created: true };
      }

      if (error) throw error;

      return { success: true, chat: data?.[0] };
    } catch (error) {
      console.error('❌ Error updating chat messages:', error);
      return { success: false, error };
    }
  },

  /**
   * Update chat title
   */
  async updateChatTitle(chatId, title, userId) {
    try {
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .update({ title })
        .eq('id', chatId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, chat: data };
    } catch (error) {
      console.error('❌ Error updating chat title:', error);
      return { success: false, error };
    }
  },

  /**
   * Delete a chat
   */
  async deleteChat(chatId, userId) {
    try {
      const { error } = await supabase
        .from('ai_chat_sessions')
        .delete()
        .eq('id', chatId)
        .eq('user_id', userId);

      if (error) throw error;

      console.log('✅ Chat deleted:', chatId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting chat:', error);
      return { success: false, error };
    }
  },

  /**
   * Generate chat title from first message - extracts key topic/entity
   */
  generateTitle(firstMessage) {
    if (!firstMessage) return 'New Conversation';

    const text = (firstMessage.content || firstMessage.text || '').trim();
    if (!text) return 'New Conversation';

    // Known aircraft models and types to look for
    const aircraftPatterns = [
      // Jets - Common manufacturers and models
      /\b(gulfstream\s*g?\d+|g\d{3,4})\b/i,
      /\b(bombardier|global\s*\d+|challenger\s*\d+)\b/i,
      /\b(cessna|citation\s*\w+)\b/i,
      /\b(embraer|phenom\s*\d+|legacy\s*\d+|praetor\s*\d+)\b/i,
      /\b(dassault|falcon\s*\d+\w*)\b/i,
      /\b(pilatus\s*pc-?\d+|pc-?\d+)\b/i,
      /\b(learjet\s*\d+\w*)\b/i,
      /\b(hawker\s*\d+)\b/i,
      /\b(beechcraft|king\s*air\s*\d+)\b/i,
      /\b(avanti\s*evo|piaggio\s*avanti|avanti)\b/i,
      /\b(hondajet)\b/i,
      /\b(eclipse\s*\d+)\b/i,
      // Helicopters
      /\b(airbus\s*h\d+|h\d{3}\w*)\b/i,
      /\b(bell\s*\d+\w*)\b/i,
      /\b(sikorsky\s*s-?\d+|s-?\d{2}\w*)\b/i,
      /\b(leonardo\s*aw\d+|aw\d+|agusta\s*\w+)\b/i,
      /\b(robinson\s*r\d+|r\d{2,3})\b/i,
      /\b(eurocopter\s*\w+|ec\d+)\b/i,
      /\b(md\s*\d+|md\d{3})\b/i,
    ];

    // Check for aircraft names first
    for (const pattern of aircraftPatterns) {
      const match = text.match(pattern);
      if (match) {
        // Capitalize properly
        let title = match[0].trim();
        // Handle specific formatting
        title = title.replace(/\s+/g, ' ');
        // Capitalize first letter of each word
        title = title.split(' ').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
        // Fix common patterns (G650 -> G650, PC-12 -> PC-12)
        title = title.replace(/\bG(\d)/gi, 'G$1');
        title = title.replace(/\bH(\d)/gi, 'H$1');
        title = title.replace(/\bPc-/gi, 'PC-');
        title = title.replace(/\bAw(\d)/gi, 'AW$1');
        title = title.replace(/\bR(\d)/gi, 'R$1');
        return title;
      }
    }

    // Look for city/destination patterns
    const destinationMatch = text.match(/(?:to|from|→|->)\s+([A-Z][a-zA-Z\s]+?)(?:\s+(?:for|from|to|with|,|\.|$))/i);
    if (destinationMatch) {
      const destination = destinationMatch[1].trim();
      if (destination.length >= 3 && destination.length <= 30) {
        return destination.split(' ').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
      }
    }

    // Look for specific service keywords
    const servicePatterns = [
      { pattern: /\b(empty\s*leg|empty-leg)\b/i, title: 'Empty Leg Inquiry' },
      { pattern: /\b(helicopter\s*tour|heli\s*tour|scenic\s*tour)\b/i, title: 'Helicopter Tour' },
      { pattern: /\b(charter\s*(?:a\s*)?helicopter|heli\s*charter)\b/i, title: 'Helicopter Charter' },
      { pattern: /\b(charter\s*(?:a\s*)?(?:private\s*)?jet|jet\s*charter|private\s*jet)\b/i, title: 'Private Jet Charter' },
      { pattern: /\b(chauffeur|limousine|limo\s*service|ground\s*transport)\b/i, title: 'Ground Transport' },
      { pattern: /\b(yacht|boat\s*charter)\b/i, title: 'Yacht Charter' },
      { pattern: /\b(concierge|luxury\s*package)\b/i, title: 'Concierge Service' },
    ];

    for (const { pattern, title } of servicePatterns) {
      if (pattern.test(text)) {
        return title;
      }
    }

    // Look for quoted text (often contains specific names)
    const quotedMatch = text.match(/["']([^"']{3,40})["']/);
    if (quotedMatch) {
      return quotedMatch[1];
    }

    // Extract capitalized proper nouns (potential names/places)
    const properNouns = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
    if (properNouns && properNouns.length > 0) {
      // Filter out common words and take the most likely topic
      const commonWords = ['I', 'The', 'A', 'An', 'This', 'That', 'Please', 'Can', 'Could', 'Would', 'Want', 'Need', 'Looking', 'Hi', 'Hello'];
      const meaningful = properNouns.filter(noun => !commonWords.includes(noun) && noun.length >= 3);
      if (meaningful.length > 0) {
        // Return the longest proper noun (more likely to be specific)
        return meaningful.sort((a, b) => b.length - a.length)[0];
      }
    }

    // Fallback: Clean up and truncate the message
    // Remove common filler phrases
    let cleanText = text
      .replace(/^(i\s+want\s+to|i\s+need\s+to|i\s+would\s+like\s+to|can\s+you|please|help\s+me)\s+/i, '')
      .replace(/^(charter|book|find|get|search\s+for)\s+/i, '')
      .trim();

    // Capitalize first letter
    cleanText = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);

    // Truncate if still too long
    if (cleanText.length > 40) {
      cleanText = cleanText.substring(0, 40).replace(/\s+\S*$/, '') + '...';
    }

    return cleanText || 'New Conversation';
  }
};
