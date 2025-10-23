# AI Integration Overview - PrivateCharterX

## 🤖 Core AI Files

### **1. Main AI Service**
**File:** `src/lib/aiService.js`
- **Purpose:** Main AI service that handles OpenAI GPT-4 integration
- **Key Features:**
  - OpenAI GPT-4 integration
  - Conversation history management
  - Search results integration
  - Temperature: 0.8, Max tokens: 300
- **API Key:** Uses `VITE_OPENAI_API_KEY` from env
- **Note:** Claude provider was removed, currently OpenAI only

### **2. AI Knowledge Base**
**File:** `src/lib/aiKnowledgeBase.js`
- **Purpose:** Contains all knowledge and context for Sphera (AI assistant)
- **Key Components:**
  - **Identity:** Name (Sphera), role, personality, response style
  - **Services Knowledge:** Empty legs, jets, helicopters, yachts, cars, adventures, CO2 certificates
  - **Pricing Information:** Detailed pricing for all service categories
  - **Features & Capabilities:** What each service offers
  - **Database Mappings:** Which tables to query for each service
  - **System Prompt Generation:** Creates context-aware prompts

### **3. OpenAI Direct Client**
**File:** `src/lib/openAI.js`
- **Purpose:** Direct OpenAI API wrapper
- **Used by:** Various components needing quick AI responses

### **4. OpenRouter Service**
**File:** `src/services/openRouterService.js`
- **Purpose:** Alternative AI provider using OpenRouter
- **Features:** Multi-model support, fallback provider

### **5. Claude Service**
**File:** `src/services/claudeService.js`
- **Purpose:** Anthropic Claude API integration
- **Status:** May be deprecated (check usage)

---

## 🎙️ Voice AI Integration

### **6. Hume EVI Client**
**File:** `src/lib/humeClient.js`
- **Purpose:** Hume AI Empathic Voice Interface
- **Features:**
  - Voice emotion detection
  - Real-time speech-to-text
  - Text-to-speech with emotion
- **API Keys:**
  - `VITE_HUME_API_KEY`
  - `VITE_HUME_SECRET_KEY`

---

## 💬 AI Chat Components

### **7. Main AI Chat Interface**
**File:** `src/components/Landingpagenew/AIChat.jsx`
- **Purpose:** Primary AI chat interface with Sphera
- **Key Features:**
  - Text and voice input
  - Unified search integration
  - Conversation history
  - Web3 wallet integration
  - NFT benefits verification
  - Payment method selection
  - Calendar integration
  - Consultation booking
  - Weather widget
- **Services Used:**
  - HumeEVIClient (voice)
  - SpheraWeb3Concierge (Web3 features)
  - OpenRouterService (AI responses)
  - UnifiedSearchService (search)
  - ConversationStateManager (state)

### **8. Chat Widget**
**File:** `src/components/Landingpagenew/ChatWidget.jsx`
- **Purpose:** Floating chat widget for sidebar
- **Features:** Quick access to AI chat from anywhere

### **9. AI Travel Agent**
**File:** `src/pages/web3/AITravelAgent.tsx`
- **Purpose:** Dedicated Web3-enabled AI travel planning interface
- **Features:** Blockchain-integrated travel booking

### **10. AI Chat Coming Soon**
**File:** `src/components/AIChatComingSoon.tsx`
- **Purpose:** Placeholder component for upcoming AI features

---

## 🧠 AI Supporting Services

### **11. Sphera Web3 Concierge**
**File:** `src/services/SpheraWeb3Concierge.js`
- **Purpose:** Web3-integrated AI concierge service
- **Features:**
  - NFT verification
  - Wallet integration
  - Blockchain-based benefits
  - Smart contract interactions

### **12. Sphera Character Config**
**File:** `src/lib/spheraCharacter.js`
- **Purpose:** Defines Sphera's personality, voice, and behavior
- **Contains:**
  - Personality traits
  - Voice configuration
  - Response templates
  - Emotional intelligence settings

### **13. Conversation State Manager**
**File:** `src/services/ConversationStateManager.js`
- **Purpose:** Manages conversation context and state
- **Features:**
  - Conversation history
  - Context switching
  - Multi-turn dialogue management
  - User intent tracking

### **14. System Prompt Config**
**File:** `src/config/systemPrompt.js`
- **Purpose:** Central configuration for AI system prompts
- **Contains:** Base instructions, guidelines, personality traits

---

## 📊 AI Knowledge & Data

### **15. AI Knowledge Base Data**
Contains comprehensive information about:
- **Services:**
  - Empty leg flights (30-50% discount)
  - Private jets (6 categories: Very Light to Ultra Long Range)
  - Helicopters (3 categories: Light, Medium, Heavy)
  - Yachts (Motor, Sailing, Mega yachts)
  - Luxury cars (Sedans, SUVs, Supercars)
  - Adventure experiences
  - CO2 certificates

- **Pricing:**
  - Hourly rates for aircraft
  - Per-flight rates for empty legs
  - Daily rates for yachts and cars
  - Per-certificate pricing for CO2

- **Features:**
  - Service-specific amenities
  - Booking processes
  - Availability updates
  - Payment options

---

## 🔑 Environment Variables Required

```bash
# OpenAI
VITE_OPENAI_API_KEY=sk-...

# Hume AI (Voice)
VITE_HUME_API_KEY=...
VITE_HUME_SECRET_KEY=...

# OpenRouter (Alternative AI)
VITE_OPENROUTER_API_KEY=...

# Claude (If used)
VITE_CLAUDE_API_KEY=...
```

---

## 🎯 AI Capabilities

### Current Features:
✅ **Natural Language Understanding**
- Understands travel requests
- Extracts dates, locations, preferences
- Context-aware responses

✅ **Service Search & Recommendations**
- Searches across 7+ service categories
- Filters by price, date, location
- Provides relevant suggestions

✅ **Voice Interaction**
- Speech-to-text (Hume EVI)
- Text-to-speech with emotion
- Hands-free booking

✅ **Web3 Integration**
- NFT verification
- Wallet connection
- Blockchain benefits

✅ **Multi-Turn Conversations**
- Maintains context
- Follow-up questions
- Clarification requests

✅ **Booking Assistance**
- Adds items to cart
- Schedules calendar events
- Request adjustments
- Consultation booking

---

## 🔄 AI Flow

```
User Input (Text/Voice)
    ↓
AIChat Component
    ↓
[Voice Input] → Hume EVI → Text Transcript
    ↓
OpenRouterService / AIService
    ↓
System Prompt (from aiKnowledgeBase.js)
    ↓
[Search Intent Detected] → UnifiedSearchService
    ↓
AI Response Generation
    ↓
[Voice Output] → Hume EVI → Speech
    ↓
Display Results + Actions
```

---

## 📝 System Prompt Structure

The system prompt includes:
1. **Identity & Role:** "You are Sphera, a luxury travel AI assistant..."
2. **Personality:** Warm, professional, solution-oriented
3. **Service Knowledge:** Detailed info about all services
4. **Pricing:** Current rates and packages
5. **Booking Process:** Step-by-step guidance
6. **Response Format:** Conversational, concise (under 4 sentences)
7. **Next Steps:** Always end with clear action

---

## 🛠️ Key Functions

### From `aiService.js`:
```javascript
generateResponse(prompt, conversationHistory, searchResults)
// Main function to get AI response

generateOpenAIResponse(prompt, conversationHistory, searchResults)
// OpenAI-specific implementation
```

### From `aiKnowledgeBase.js`:
```javascript
getSystemPrompt()
// Returns complete system prompt with all knowledge

AI_KNOWLEDGE_BASE
// Object containing all service info, pricing, features
```

### From `humeClient.js`:
```javascript
connect()
// Connect to Hume voice service

sendText(text)
// Convert text to speech

onMessage(callback)
// Handle voice transcriptions
```

---

## 🔍 Search Integration

AI integrates with `UnifiedSearchService` to search:
- Empty legs (`EmptyLegs_` table)
- Jets (`jets` table)
- Helicopters (`helicopters` table)
- Yachts (`yachts` table)
- Luxury cars (`luxury_cars` table)
- Adventures (`adventures` table)
- CO2 certificates (`co2_certificates` table)

---

## 💡 Usage Examples

### Text Conversation:
```
User: "I need a jet from Zurich to London tomorrow"
Sphera: "I found 12 jets available for Zurich to London tomorrow.
        We have light jets starting at CHF 8,500 and heavy jets
        for larger groups. Would you like to see the options or
        filter by aircraft size?"
```

### Voice Conversation:
```
User: [speaks] "Show me empty legs to Paris"
Sphera: [speaks] "I found 5 empty leg flights to Paris with
        discounts up to 45%. The best deal is a Citation CJ3
        for CHF 6,800 departing Geneva on Thursday.
        Should I add it to your cart?"
```

### Web3 Integration:
```
User: "I have an NFT membership"
Sphera: "Great! I see your NFT membership gives you 20% off
        and priority booking. Let me apply that to your search.
        You've also unlocked access to our exclusive
        ultra-long-range fleet."
```

---

## 🚀 Future Enhancements

Potential improvements:
- [ ] Multi-language support
- [ ] Image generation for itineraries
- [ ] Predictive booking recommendations
- [ ] Price optimization AI
- [ ] Sentiment analysis
- [ ] Dynamic pricing negotiation
- [ ] Integration with more AI providers
- [ ] Custom voice cloning
- [ ] Video call support

---

## 📊 Performance Metrics

Current AI settings:
- **Model:** GPT-4
- **Temperature:** 0.8 (creative but controlled)
- **Max Tokens:** 300 (concise responses)
- **Response Time:** ~2-3 seconds
- **Voice Latency:** ~1-2 seconds (Hume EVI)

---

## 🔒 Security Considerations

1. **API Keys:** Stored in environment variables, never committed
2. **Browser Exposure:** `dangerouslyAllowBrowser: true` for OpenAI (frontend use)
3. **User Data:** Conversations stored locally, not on AI servers
4. **Wallet Integration:** Secure wallet signature verification
5. **Rate Limiting:** Should implement rate limiting for API calls

---

## 📞 Support & Maintenance

To update AI behavior:
1. **Modify Knowledge:** Edit `src/lib/aiKnowledgeBase.js`
2. **Change Personality:** Update `src/lib/spheraCharacter.js`
3. **Adjust Prompts:** Modify `src/config/systemPrompt.js`
4. **Switch Provider:** Change in `src/lib/aiService.js`

To debug AI issues:
1. Check browser console for API errors
2. Verify environment variables are set
3. Test with simpler prompts
4. Check conversation history length
5. Monitor API rate limits

---

## 📚 Documentation References

- [OpenAI API Docs](https://platform.openai.com/docs)
- [Hume AI EVI Docs](https://docs.hume.ai/)
- [OpenRouter Docs](https://openrouter.ai/docs)
- [Anthropic Claude Docs](https://docs.anthropic.com/)
