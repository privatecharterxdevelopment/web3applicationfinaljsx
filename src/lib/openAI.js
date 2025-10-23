import OpenAI from 'openai';
import { getSystemPrompt } from './aiKnowledgeBase';

// Real OpenAI implementation
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

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

export class SphereAI {
  constructor() {
    this.initialized = true;
  }

  async generateResponse(prompt, conversationHistory = [], searchResults = null) {
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
          tokens_used: response.usage.total_tokens
        }
      };
    } catch (error) {
      console.error('OpenAI generate response error:', error);
      // Fallback to mock response
      let response = this.generateContextualResponse(prompt, conversationHistory, searchResults);
      return {
        content: response,
        confidence_score: 85,
        timestamp: new Date(),
        metadata: {
          model: 'sphera-travel-assistant-fallback',
          tokens_used: Math.floor(Math.random() * 200) + 50
        }
      };
    }
  }

  generateContextualResponse(prompt, history) {
    const lowerPrompt = prompt.toLowerCase();
    
    // Private jet responses
    if (lowerPrompt.includes('private jet') || lowerPrompt.includes('charter')) {
      return `I'd be happy to help you with private jet charter options! To provide you with the best recommendations, I'll need some details:

• Departure city and destination
• Travel dates and preferred times
• Number of passengers
• Any specific aircraft preferences
• Special requirements (catering, ground transportation, etc.)

Our fleet includes light jets perfect for short trips, mid-size jets for comfort on medium routes, and heavy jets for long-haul international travel. We also offer empty leg flights at discounted rates when available.

What's your preferred departure location?`;
    }
    
    // Helicopter responses
    if (lowerPrompt.includes('helicopter')) {
      return `Helicopter charters offer incredible flexibility and access to unique destinations! We provide:

• City transfers and airport shuttles
• Scenic tours and photography flights
• Access to remote locations
• Emergency and medical transport
• Corporate and VIP services

Our helicopter fleet ranges from single-engine aircraft for short hops to twin-engine helicopters for longer distances and challenging weather conditions.

Where would you like to fly, and what type of service are you looking for?`;
    }
    
    // Adventure packages
    if (lowerPrompt.includes('adventure') || lowerPrompt.includes('package')) {
      return `Our adventure packages combine luxury aviation with unforgettable experiences! Popular options include:

• Alpine skiing with helicopter access to pristine slopes
• Island hopping in the Caribbean or Mediterranean
• Safari experiences with charter flights to remote lodges
• Mountain expedition support
• Yacht and aviation combinations

Each package is fully customized to your interests and includes private aviation, luxury accommodations, and expert guides.

What type of adventure interests you most?`;
    }
    
    // Concierge services
    if (lowerPrompt.includes('concierge') || lowerPrompt.includes('planning')) {
      return `Our full concierge service handles every detail of your luxury travel experience:

• Private aviation booking and management
• Luxury accommodation reservations
• Ground transportation coordination
• Restaurant reservations and special experiences
• Travel documentation and logistics
• 24/7 support during your journey

We work with a global network of premium partners to ensure seamless, personalized service from departure to return.

Tell me about your upcoming travel plans, and I'll outline how we can make them extraordinary!`;
    }
    
    // Follow-up questions
    if (history.length > 0) {
      const responses = [
        "Thank you for that information! Based on what you've told me, I can suggest several excellent options. Would you like me to provide specific aircraft recommendations and pricing estimates?",
        "Perfect! I'm gathering some options that match your requirements. Can you tell me more about your timeline - is this for immediate travel or are you planning ahead?",
        "Excellent choice! I have several aircraft that would be perfect for your needs. Would you prefer me to focus on cost efficiency, travel time, or luxury amenities?",
        "That's helpful context! Let me check availability for your preferred dates. In the meantime, do you have any specific preferences for aircraft size or onboard amenities?"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Default response
    return `Hello! I'm Sphera, your luxury aviation specialist. I'm here to help you with:

• Private jet and helicopter charters
• Luxury travel planning and coordination
• Adventure packages and unique experiences
• Concierge services for seamless travel

Whether you're planning a business trip, family vacation, or special celebration, I'll help create the perfect aviation solution for your needs.

How can I assist you today?`;
  }

  async extractTravelRequest(messages) {
    try {
      const messageText = messages.map(m => m.content).join('\n');

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Extract booking details from this conversation.

Services available:
- empty_legs: Empty leg flights
- jets: Private jet charters
- helicopters: Helicopter charters
- luxury_cars: Luxury and sports cars
- yachts: Yacht charters
- adventures: Adventure packages
- taxi: Taxi/concierge services

Return ONLY valid JSON:
{
  "service_type": "empty_legs|jets|helicopters|luxury_cars|yachts|adventures|taxi",
  "from_location": "city/airport or null",
  "to_location": "city/airport or null",
  "date_start": "YYYY-MM-DD or null",
  "date_end": "YYYY-MM-DD or null",
  "passengers": number or null,
  "budget": number or null,
  "pets": number or null,
  "special_requirements": "string or null"
}`
          },
          {
            role: 'user',
            content: messageText
          }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      });

      const extractedData = JSON.parse(response.choices[0].message.content);

      return {
        ...extractedData,
        confidence_score: 90,
        departure_location: extractedData.from_location,
        destination: extractedData.to_location,
        travel_date: extractedData.date_start,
        passenger_count: extractedData.passengers,
        requirements: extractedData.special_requirements ? [extractedData.special_requirements] : []
      };
    } catch (error) {
      console.error('OpenAI extract request error:', error);
      // Fallback to simple extraction
      const messageText = messages.map(m => m.content).join(' ').toLowerCase();

      const extractedData = {
        service_type: this.extractServiceType(messageText),
        departure_location: this.extractLocation(messageText, ['from', 'departure', 'leaving']),
        destination: this.extractLocation(messageText, ['to', 'destination', 'going']),
        travel_date: this.extractDate(messageText),
        passenger_count: this.extractPassengerCount(messageText),
        confidence_score: 70,
        requirements: this.extractRequirements(messageText)
      };

      return extractedData;
    }
  }

  extractServiceType(text) {
    if (text.includes('private jet') || text.includes('jet charter')) return 'private-jet';
    if (text.includes('helicopter')) return 'helicopter';
    if (text.includes('adventure')) return 'adventure';
    return 'concierge';
  }

  extractLocation(text, keywords) {
    // Simple city extraction (would use NLP in production)
    const cities = ['london', 'paris', 'new york', 'dubai', 'tokyo', 'geneva', 'zurich', 'monaco'];
    for (const city of cities) {
      if (text.includes(city)) {
        return city.charAt(0).toUpperCase() + city.slice(1);
      }
    }
    return null;
  }

  extractDate(text) {
    // Simple date extraction
    if (text.includes('tomorrow')) return new Date(Date.now() + 24 * 60 * 60 * 1000);
    if (text.includes('next week')) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return null;
  }

  extractPassengerCount(text) {
    const match = text.match(/(\d+)\s*(passenger|people|person)/);
    return match ? parseInt(match[1]) : 1;
  }

  extractRequirements(text) {
    const requirements = [];
    if (text.includes('catering')) requirements.push('catering');
    if (text.includes('ground transport')) requirements.push('ground_transport');
    if (text.includes('wifi')) requirements.push('wifi');
    return requirements;
  }
}

export class TravelRequestService {
  constructor(supabaseClient, userId) {
    this.supabase = supabaseClient;
    this.userId = userId;
  }

  async getAvailableOffers(serviceType) {
    try {
      // Mock offers data
      const mockOffers = this.generateMockOffers(serviceType);
      
      return {
        success: true,
        offers: mockOffers,
        count: mockOffers.length
      };
    } catch (error) {
      console.error('Error fetching offers:', error);
      return {
        success: false,
        offers: [],
        error: error.message
      };
    }
  }

  generateMockOffers(serviceType) {
    const offers = [];
    
    if (serviceType === 'private-jet') {
      offers.push(
        {
          id: 'pj-001',
          title: 'Citation CJ3+ - European Routes',
          description: 'Light jet perfect for short to medium European flights',
          price_from: 8500,
          currency: 'CHF',
          aircraft_type: 'Light Jet',
          max_passengers: 7,
          range: '3700 km',
          availability: 'Available'
        },
        {
          id: 'pj-002',
          title: 'Gulfstream G550 - Intercontinental',
          description: 'Heavy jet for long-haul flights with luxury amenities',
          price_from: 35000,
          currency: 'CHF',
          aircraft_type: 'Heavy Jet',
          max_passengers: 14,
          range: '12500 km',
          availability: 'Limited'
        }
      );
    }
    
    if (serviceType === 'helicopter') {
      offers.push(
        {
          id: 'hc-001',
          title: 'H125 - City Transfers',
          description: 'Single-engine helicopter for airport transfers and city hops',
          price_from: 2800,
          currency: 'CHF',
          aircraft_type: 'Single Engine',
          max_passengers: 5,
          range: '600 km',
          availability: 'Available'
        }
      );
    }
    
    return offers;
  }

  async saveConversation(conversationId, messages) {
    try {
      // Mock saving to Supabase
      const conversationData = {
        id: conversationId,
        user_id: this.userId,
        messages: messages,
        created_at: new Date(),
        updated_at: new Date(),
        status: 'active'
      };

      console.log('Saving conversation:', conversationData);
      
      // In real implementation, this would save to Supabase
      // const { data, error } = await this.supabase
      //   .from('travel_conversations')
      //   .insert([conversationData]);
      
      return {
        success: true,
        conversation: conversationData
      };
    } catch (error) {
      console.error('Error saving conversation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createTravelRequest(conversationId, extractedData, messages) {
    try {
      const requestData = {
        id: crypto.randomUUID(),
        user_id: this.userId,
        conversation_id: conversationId,
        service_type: extractedData.service_type,
        departure_location: extractedData.departure_location,
        destination: extractedData.destination,
        travel_date: extractedData.travel_date,
        passenger_count: extractedData.passenger_count,
        requirements: extractedData.requirements,
        status: 'pending',
        confidence_score: extractedData.confidence_score,
        raw_conversation: messages,
        created_at: new Date(),
        updated_at: new Date()
      };

      console.log('Creating travel request:', requestData);
      
      // Mock email notification
      setTimeout(() => {
        console.log('Email notification sent to bookings@privatecharterx.com');
      }, 1000);
      
      // In real implementation, this would save to Supabase user_requests table
      // const { data, error } = await this.supabase
      //   .from('user_requests')
      //   .insert([requestData]);
      
      return {
        success: true,
        request: requestData
      };
    } catch (error) {
      console.error('Error creating travel request:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getRequestHistory() {
    try {
      // Mock request history
      const mockHistory = [
        {
          id: 'req-001',
          service_type: 'private-jet',
          departure_location: 'Geneva',
          destination: 'London',
          status: 'completed',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      ];
      
      return {
        success: true,
        requests: mockHistory
      };
    } catch (error) {
      console.error('Error fetching request history:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export default for backward compatibility
export default {
  SphereAI,
  TravelRequestService
};