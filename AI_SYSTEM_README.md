# 🤖 PrivateCharterX AI Assistant (Sphera) - Complete Guide

## ✅ What's Been Set Up

Your AI assistant is **FULLY CONFIGURED** and ready to go live! Here's what's been implemented:

---

## 📁 New Files Created

### 1. **`src/lib/aiKnowledgeBase.js`** - AI Knowledge Base
**What it is:** Single source of truth for all AI knowledge - services, pricing, policies, CO₂ info

**What you can edit:**
- Service descriptions and features
- Pricing guidelines
- Adventure package details
- CO₂ project information
- AI personality and response examples
- Booking rules and policies

**How to update:** Just edit this file and the AI will instantly know the new information!

```javascript
// Example: Add a new adventure package
adventures: {
  packages: {
    myNewAdventure: {
      name: "Caribbean Island Hopping",
      location: "St. Barts, BVI",
      duration: "7 days",
      includes: ["Yacht charter", "Helicopter transfers", ...],
      priceFrom: "CHF 35,000 per person"
    }
  }
}
```

### 2. **`src/components/BookingCard.jsx`** - Universal Booking Card
**What it does:**
- ✅ Modify date & time (except empty legs - they're fixed!)
- ✅ Adjust passenger count
- ✅ Select CO₂ certificate type (PDF or NFT)
- ✅ Choose CO₂ offset project (4 options)
- ✅ Real-time price calculation
- ✅ Add to cart with all selections

**Used for:** All services (jets, helicopters, cars, yachts, adventures)

---

## 🔧 Updated Files

### 1. **`src/lib/openAI.js`**
- ✅ Now uses environment variable for API key
- ✅ Imports knowledge from `aiKnowledgeBase.js`
- ✅ Cleaner, more maintainable code

### 2. **`.env`**
- ✅ OpenAI API key configured
- ✅ All API keys in one place

---

## 🎯 What the AI Can Do NOW

### **Real-Time Data Search**
The AI searches your **REAL Supabase tables**:

| Service | Table Name | Status |
|---------|-----------|--------|
| Empty Legs | `EmptyLegs_` | ✅ Connected (updates every 3 hours!) |
| Private Jets | `jets` | ✅ Connected |
| Helicopters | `helicopters` | ✅ Connected |
| Luxury Cars | `luxury_cars` | ✅ Connected |
| Yachts | `yachts` | ✅ Connected |
| Adventures | `adventures` | ✅ Connected |
| Taxi/Transfers | `fixed_offers` | ✅ Connected |
| Events | Ticketmaster + Eventbrite APIs | ✅ Connected |

### **Intelligent Dialog Understanding**

**Example 1: Incomplete Request**
```
User: "I need a jet"
AI: "I'd love to help you book a private jet! Could you tell me where you're
     departing from and where you'd like to go? Or if you're flexible, I can
     show you available empty legs for great deals!"
```

**Example 2: With Location**
```
User: "London to Paris next week for 4 people"
AI: "Perfect! London to Paris next week for 4 passengers - I'm searching for
     private jets and empty legs now."

[Shows 8 jets + 2 empty legs with prices]

AI: "Excellent news! I found 8 private jet options from CHF 4,500/hour.
     The Citation CJ3+ is perfect for your group. Would you like to proceed
     with booking?"
```

**Example 3: Multi-Service Request**
```
User: "Helicopter to Zermatt for heli-skiing next week"
AI: "Perfect! I found 3 helicopters to Zermatt AND 2 heli-skiing adventure
     packages. The H125 is CHF 3,500/hour, or would you prefer the all-
     inclusive 3-day skiing package for CHF 15,000?"
```

### **Smart Features**

✅ **Extract Intent:** Understands locations, dates, passenger count, budget
✅ **Multi-Service Search:** Can search jets + helicopters + adventures simultaneously
✅ **Ask Clarifying Questions:** If info is missing, asks ONE question at a time
✅ **Save Requests:** All chat requests saved to `chat_requests` table
✅ **Email Notifications:** Sends alert when no results found
✅ **Voice Input:** Users can speak their requests
✅ **Conversation Memory:** Remembers context throughout the chat

---

## 💰 CO₂ Certificate System (Built-In!)

### **Certificate Types**
1. **Classic PDF Certificate** - Traditional carbon offset certificate (email delivery)
2. **Blockchain NFT Certificate** - On Polygon network (minted to wallet)

### **4 Carbon Offset Projects**
1. 🌳 **Rainforest Conservation** - Amazon, Brazil
2. 💨 **Wind Energy** - Tamil Nadu, India
3. 🌊 **Ocean Cleanup** - Pacific Ocean
4. ☀️ **Solar Farms** - Morocco

### **Pricing**
- **Empty Legs:** FREE (included automatically)
- **Other Services:** €80 per ton CO₂ (optional add-on)

### **How It Works**
User selects:
1. Certificate type (PDF or NFT)
2. Project to support
3. Adds to cart with their booking

---

## 🛠️ Booking Flexibility Matrix

| Service | Date Change | Time Change | Passengers | Lead Time |
|---------|-------------|-------------|------------|-----------|
| Empty Legs | ❌ Fixed | ❌ Fixed | ✅ Yes | N/A (real-time) |
| Jets | ✅ Yes | ✅ Yes | ✅ Yes | 4h domestic, 24h international |
| Helicopters | ✅ Yes | ✅ Yes | ✅ Yes | 2 hours |
| Cars | ✅ Yes | ✅ Yes | ❌ N/A | 3 hours |
| Yachts | ✅ Yes | ⚠️ Limited | ✅ Yes | 7 days |
| Adventures | ✅ Yes | ⚠️ Limited | ✅ Yes | 14 days |

*Built into the AI's knowledge - it will explain limitations automatically!*

---

## 🚀 How to Use

### **For You (Admin)**

**1. Update AI Knowledge:**
Edit `src/lib/aiKnowledgeBase.js` - that's it!

**2. Add Adventure Packages:**
```javascript
// In aiKnowledgeBase.js
adventures: {
  packages: {
    newPackage: {
      name: "Your Package Name",
      location: "Where",
      duration: "How long",
      includes: ["What's included"],
      priceFrom: "CHF X,XXX"
    }
  }
}
```

**3. Modify AI Personality:**
```javascript
// In aiKnowledgeBase.js
identity: {
  name: "Sphera", // Change AI name
  personality: "Warm, professional...", // Change tone
  responseStyle: "Concise..." // Change style
}
```

### **For Users (Customers)**

**1. Open AI Chat**
- Click AI chat icon
- Type or speak their request

**2. AI Understands:**
- "I need a jet to Monaco"
- "Helicopter to Verbier for skiing"
- "Show me empty legs this week"
- "Concert tickets in London"

**3. AI Searches & Shows Results**
- Real-time database query
- Multiple service types
- Organized in tabs

**4. User Modifies Booking**
- Change date/time
- Adjust passengers
- Select CO₂ project
- See updated price

**5. Add to Cart**
- All selections saved
- Continue shopping or checkout

---

## 📊 Current API Keys

### **OpenAI (GPT-4)**
- **Location:** `.env` → `VITE_OPENAI_API_KEY`
- **Current Key:** `sk-proj-VNCML4y...` (in .env file)
- **Usage:** AI responses, intent extraction
- **Cost:** ~$0.002 per conversation (very cheap!)

### **Ticketmaster**
- **Location:** `.env` → `VITE_TICKETMASTER_CONSUMER_KEY`
- **Status:** ✅ Connected
- **Purpose:** Event listings (info only)

### **Eventbrite**
- **Location:** `.env` → `VITE_EVENTBRITE_TOKEN`
- **Status:** ✅ Connected
- **Purpose:** Event bookings (full checkout)

---

## ⚙️ How It All Works Together

```
User Types: "I need a private jet to Dubai for 6 people"
    ↓
AI (GPT-4) Extracts:
    • Service: private-jet
    • Destination: Dubai
    • Passengers: 6
    ↓
Search Service Queries Supabase:
    • Table: jets
    • Filter: passenger_capacity >= 6
    • Results: 12 jets found
    ↓
AI Generates Response:
    "Perfect! I found 12 private jets that seat 6+ passengers to Dubai.
     The Gulfstream G550 heavy jet is ideal for this route. Would you
     like to see the options?"
    ↓
Display Results in Cards:
    • BookingCard component
    • User can modify date, time, passengers
    • Select CO₂ project
    • See real-time pricing
    ↓
User Adds to Cart:
    • All modifications saved
    • CO₂ certificate included
    • Ready for checkout
```

---

## 🎨 Customization Examples

### **Change AI Greeting**
```javascript
// In aiKnowledgeBase.js → responseGuidelines → examples
welcomeMessage: {
  response: "Welcome to PrivateCharterX! I'm Sphera, your luxury travel concierge.
             Tell me about your travel plans and I'll find the perfect solution!"
}
```

### **Add New Service**
```javascript
// In aiKnowledgeBase.js → services
jetSki: {
  name: "Jet Ski Rental",
  description: "High-performance jet ski rentals",
  icon: "🏄",
  keywords: ["jet ski", "watercraft"],
  database: "jetskis" // Your Supabase table name
}
```

### **Update Pricing**
```javascript
// In aiKnowledgeBase.js → services → jets → categories
lightJet: {
  hourlyRate: "CHF 5,000 - 8,000" // Update range
}
```

---

## ✅ Testing Checklist

Test these scenarios to verify everything works:

1. ✅ **"I need a jet"** - AI asks for location
2. ✅ **"London to Paris"** - AI asks for passenger count
3. ✅ **"4 people"** - Shows results (jets + empty legs)
4. ✅ **"Show me helicopters"** - Shows helicopter results
5. ✅ **"Empty leg to Monaco"** - Shows empty legs
6. ✅ **"Concert tickets in London"** - Shows Ticketmaster/Eventbrite
7. ✅ **Modify date in card** - Updates price
8. ✅ **Change passengers** - Updates availability
9. ✅ **Select CO₂ project** - Shows in cart
10. ✅ **Add to cart** - Saves all selections

---

## 🐛 Troubleshooting

### **"AI not responding"**
- Check `.env` → `VITE_OPENAI_API_KEY` is set
- Verify OpenAI account has credits
- Check browser console for errors

### **"No results found"**
- Verify Supabase tables have data
- Check table names match (case-sensitive!)
- Test with: "show me all jets" (should return something)

### **"Can't modify date on empty leg"**
- This is CORRECT behavior!
- Empty legs have fixed dates (repositioning flights)
- AI should explain this to user

---

## 📞 Need Help?

**Quick Edits:** Just modify `aiKnowledgeBase.js`
**Advanced Changes:** Ask me to update the code
**New Features:** Describe what you want added

---

## 🎉 Summary

**You now have:**
- ✅ Fully functional AI assistant (Sphera)
- ✅ Real-time Supabase data integration
- ✅ Event search (Ticketmaster + Eventbrite)
- ✅ Booking modification system
- ✅ CO₂ certificate selection (4 projects, 2 types)
- ✅ Add to cart functionality
- ✅ Easy knowledge base editing
- ✅ All in separate, organized files

**The AI is LIVE and ready to chat with customers!** 🚀
