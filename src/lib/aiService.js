import OpenAI from 'openai';
import { getSystemPrompt } from './aiKnowledgeBase';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// Claude removed

export class AIService {
  constructor(provider = 'openai') {
    this.provider = provider; // 'openai'
    this.initialized = true;
  }

  setProvider(provider) {
    this.provider = provider;
  }

  async generateResponse(prompt, conversationHistory = [], searchResults = null) {
    return this.generateOpenAIResponse(prompt, conversationHistory, searchResults);
  }

  async generateOpenAIResponse(prompt, conversationHistory = [], searchResults = null) {
    try {
      const messages = [
        {
          role: 'system',
          content: getSystemPrompt()
        },
        ...conversationHistory.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        {
          role: 'user',
          content: searchResults
            ? `User said: "${prompt}"\n\nSearch Results Found: ${searchResults.totalResults} options across ${Object.keys(searchResults).filter(k => searchResults[k] && searchResults[k].length > 0).length} categories. Please describe the results enthusiastically and guide them to review and book.`
            : prompt
        }
      ];

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages,
        temperature: 0.8,
        max_tokens: 300
      });

      return {
        content: response.choices[0].message.content,
        confidence_score: 90,
        timestamp: new Date(),
        metadata: {
          model: 'gpt-4',
          tokens_used: response.usage.total_tokens,
          provider: 'openai'
        }
      };
    } catch (error) {
      console.error('OpenAI generate response error:', error);
      // Fallback to mock response
      return {
        content: this.generateFallbackResponse(prompt, conversationHistory, searchResults),
        confidence_score: 85,
        timestamp: new Date(),
        metadata: {
          model: 'fallback',
          tokens_used: 50,
          provider: 'fallback'
        }
      };
    }
  }

  generateFallbackResponse(prompt, history, searchResults) {
    const lowerPrompt = prompt.toLowerCase();
    
    if (searchResults && searchResults.totalResults > 0) {
      return `Great! I found ${searchResults.totalResults} options for you. Take a look at the results below and let me know which one interests you most. I can help you with booking details or answer any questions about the options.`;
    }
    
    // Private jet responses
    if (lowerPrompt.includes('private jet') || lowerPrompt.includes('charter')) {
      return `I'd be happy to help you with private jet charter options! To provide you with the best recommendations, I'll need some details:

• Where are you flying from and to?
• What date and time do you prefer?
• How many passengers?
• Any specific aircraft preferences?

Let me search our available options for you!`;
    }

    // Empty leg responses
    if (lowerPrompt.includes('empty leg')) {
      return `Empty leg flights are a fantastic way to save on private jet travel! These are one-way flights that need to reposition aircraft.

Could you share:
• Your departure city?
• Preferred destination?
• Travel dates (flexible dates get better deals)?
• Number of passengers?

I'll find the best empty leg opportunities for you!`;
    }

    // Helicopter responses
    if (lowerPrompt.includes('helicopter')) {
      return `Helicopter transfers offer the ultimate in convenience and luxury! Perfect for:

• Airport transfers
• City-to-city transport
• Scenic tours
• Event arrivals

Where would you like to fly? I can check availability and pricing for your route.`;
    }

    // Luxury car responses
    if (lowerPrompt.includes('luxury car') || lowerPrompt.includes('car service')) {
      return `Our luxury car service provides premium ground transportation with professional chauffeurs.

To find the perfect vehicle:
• Pick-up location?
• Destination?
• Date and time?
• Duration (hourly, daily, transfer)?
• Vehicle preference (sedan, SUV, exotic)?

Let me search our fleet for you!`;
    }

    // General travel response
    return `I'm here to help with all your luxury travel needs! I can assist with:

• Private jets and empty legs
• Helicopter transfers  
• Luxury car service
• Yacht charters
• Adventure experiences

What type of travel are you planning? Share some details and I'll find the perfect options for you!`;
  }
}

// Legacy SphereAI class for backward compatibility
export class SphereAI extends AIService {
  constructor() {
    super('claude'); // Default to Claude for new instances
  }
}

/**
 * Transcribe audio to text using Whisper AI
 */
export const transcribeAudio = async (audioBlob) => {
  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');

    const response = await openai.audio.transcriptions.create({
      file: audioBlob,
      model: 'whisper-1',
      language: 'en'
    });

    return {
      success: true,
      text: response.text
    };
  } catch (error) {
    console.error('Whisper transcription error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default AIService;